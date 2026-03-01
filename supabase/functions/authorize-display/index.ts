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
    const { device_code, event_code } = await req.json();

    // 2. Validate input
    if (!device_code || typeof device_code !== 'string' || device_code.length !== 6) {
      return jsonResponse({ error: 'device_code must be exactly 6 characters' }, 400);
    }
    if (!event_code || typeof event_code !== 'string') {
      return jsonResponse({ error: 'event_code is required' }, 400);
    }

    // 3. Create Supabase client with service_role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Find event by code
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, type, status, display_photo_duration, max_display_sessions')
      .eq('code', event_code)
      .single();

    if (eventError || !event) {
      return jsonResponse({ error: 'Evento no encontrado' }, 404);
    }
    if (event.status !== 'active') {
      return jsonResponse({ error: 'El evento no esta activo' }, 404);
    }

    // 5. Find pending display session by device_code
    const { data: session, error: sessionError } = await supabase
      .from('display_sessions')
      .select('id')
      .eq('event_id', event.id)
      .eq('device_code', device_code)
      .eq('is_active', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return jsonResponse({ error: 'Codigo invalido o expirado' }, 404);
    }

    // 6. Check active session limit
    const { count, error: countError } = await supabase
      .from('display_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('is_active', true);

    if (countError) {
      console.error('Failed to count active sessions:', countError);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }

    if (count !== null && count >= event.max_display_sessions) {
      return jsonResponse(
        { error: 'Limite de pantallas alcanzado' },
        409,
      );
    }

    // 7. Activate session with real token
    const newToken = crypto.randomUUID();

    const { error: updateError } = await supabase
      .from('display_sessions')
      .update({
        is_active: true,
        session_token: newToken,
        last_heartbeat: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Failed to activate session:', updateError);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }

    // 8. Return success
    return jsonResponse(
      {
        session_token: newToken,
        event: {
          id: event.id,
          name: event.name,
          type: event.type,
          status: event.status,
          display_photo_duration: event.display_photo_duration,
        },
      },
      200,
    );
  } catch (err) {
    console.error('authorize-display error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
