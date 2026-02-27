import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // 1. Parse body
    const { event_id, method, registration_id } = await req.json();

    if (!event_id || typeof event_id !== 'string') {
      return jsonResponse({ error: 'event_id is required' }, 400);
    }
    if (method !== 'random' && method !== 'manual') {
      return jsonResponse(
        { error: 'method must be "random" or "manual"' },
        400,
      );
    }
    if (method === 'manual' && (!registration_id || typeof registration_id !== 'string')) {
      return jsonResponse(
        { error: 'registration_id is required for manual selection' },
        400,
      );
    }

    // 2. Authenticate caller via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user identity with anon key + their JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !authUser) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401);
    }

    // Service role client for all data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Look up user's tenant and role
    const { data: appUser, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', authUser.id)
      .single();

    if (userError || !appUser) {
      return jsonResponse({ error: 'User not found' }, 403);
    }
    if (appUser.role !== 'tenant_admin' && appUser.role !== 'super_admin') {
      return jsonResponse({ error: 'Insufficient permissions' }, 403);
    }

    // 4. Fetch event and validate
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, tenant_id, status')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return jsonResponse({ error: 'Event not found' }, 404);
    }
    if (event.status !== 'active' && event.status !== 'closed') {
      return jsonResponse(
        { error: 'Event must be active or closed to select a winner' },
        400,
      );
    }
    if (appUser.role !== 'super_admin' && event.tenant_id !== appUser.tenant_id) {
      return jsonResponse({ error: 'Event does not belong to your tenant' }, 403);
    }

    let selectedRegistrationId: string;
    let selectedContactId: string;

    if (method === 'random') {
      // 5a. Random selection — exclude existing winners
      const { data: eligible, error: eligibleError } = await supabase
        .from('event_registrations')
        .select('id, contact_id')
        .eq('event_id', event_id)
        .not(
          'contact_id',
          'in',
          `(${
            // Subquery: contacts already winners
            await (async () => {
              const { data: existingWinners } = await supabase
                .from('event_winners')
                .select('contact_id')
                .eq('event_id', event_id);
              if (!existingWinners || existingWinners.length === 0) return "'__none__'";
              return existingWinners.map((w) => `'${w.contact_id}'`).join(',');
            })()
          })`,
        );

      if (eligibleError) {
        console.error('Error fetching eligible participants:', eligibleError);
        return jsonResponse({ error: 'Internal server error' }, 500);
      }
      if (!eligible || eligible.length === 0) {
        return jsonResponse(
          { error: 'No hay participantes elegibles' },
          409,
        );
      }

      // Server-side random selection using crypto
      const randomBytes = new Uint32Array(1);
      crypto.getRandomValues(randomBytes);
      const randomIndex = randomBytes[0] % eligible.length;
      const chosen = eligible[randomIndex];

      selectedRegistrationId = chosen.id;
      selectedContactId = chosen.contact_id;
    } else {
      // 5b. Manual selection — validate registration belongs to event
      const { data: registration, error: regError } = await supabase
        .from('event_registrations')
        .select('id, contact_id')
        .eq('id', registration_id)
        .eq('event_id', event_id)
        .single();

      if (regError || !registration) {
        return jsonResponse(
          { error: 'Registration not found for this event' },
          404,
        );
      }

      // Check if this contact is already a winner
      const { data: existingWinner } = await supabase
        .from('event_winners')
        .select('id')
        .eq('event_id', event_id)
        .eq('contact_id', registration.contact_id)
        .maybeSingle();

      if (existingWinner) {
        return jsonResponse(
          { error: 'Este participante ya es ganador del evento' },
          409,
        );
      }

      selectedRegistrationId = registration.id;
      selectedContactId = registration.contact_id;
    }

    // 6. Insert winner
    const { data: newWinner, error: insertError } = await supabase
      .from('event_winners')
      .insert({
        event_id,
        registration_id: selectedRegistrationId,
        contact_id: selectedContactId,
        selected_by: authUser.id,
      })
      .select('id, event_id, registration_id, contact_id, selected_by, selected_at')
      .single();

    if (insertError || !newWinner) {
      console.error('Error inserting winner:', insertError);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }

    // 7. Count winner position
    const { count } = await supabase
      .from('event_winners')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event_id);

    // 8. Fetch contact data
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name, email, phone')
      .eq('id', selectedContactId)
      .single();

    return jsonResponse(
      {
        winner: {
          ...newWinner,
          contact: contact ?? {
            first_name: null,
            last_name: null,
            email: null,
            phone: null,
          },
        },
        winner_number: count ?? 1,
      },
      201,
    );
  } catch (err) {
    console.error('select-winner error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
