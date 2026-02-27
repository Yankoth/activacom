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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { event_code, email, phone } = await req.json();

    if (!event_code || typeof event_code !== 'string') {
      return jsonResponse({ error: 'Event code is required' }, 400);
    }

    if (!email && !phone) {
      return jsonResponse({ error: 'Email or phone is required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find the event + tenant
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, tenant_id')
      .eq('code', event_code)
      .eq('status', 'active')
      .single();

    if (eventError || !event) {
      return jsonResponse({ error: 'Event not found' }, 404);
    }

    // Look for existing contact in tenant by email or phone
    let contact = null;

    if (email) {
      const { data } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .eq('tenant_id', event.tenant_id)
        .eq('email', email.trim().toLowerCase())
        .single();
      contact = data;
    }

    if (!contact && phone) {
      const { data } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .eq('tenant_id', event.tenant_id)
        .eq('phone', phone.trim())
        .single();
      contact = data;
    }

    if (!contact) {
      return jsonResponse(
        {
          registered_in_event: false,
          returning_contact: false,
          contact_name: null,
          prefill_data: null,
        },
        200,
      );
    }

    const contactName = [contact.first_name, contact.last_name]
      .filter(Boolean)
      .join(' ') || null;

    // Check if already registered in THIS event
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', event.id)
      .eq('contact_id', contact.id)
      .single();

    if (registration) {
      return jsonResponse(
        {
          registered_in_event: true,
          returning_contact: true,
          contact_name: contactName,
          prefill_data: null,
        },
        200,
      );
    }

    // Contact exists but NOT in this event — returning contact, get prefill data
    const { data: lastRegistration } = await supabase
      .from('event_registrations')
      .select('form_data')
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return jsonResponse(
      {
        registered_in_event: false,
        returning_contact: true,
        contact_name: contactName,
        prefill_data: lastRegistration?.form_data ?? null,
      },
      200,
    );
  } catch {
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
