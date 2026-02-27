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
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return jsonResponse({ error: 'Event code is required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find active event by code
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(
        'id, name, type, status, privacy_notice_url, photo_source, geofencing_enabled, geofencing_lat, geofencing_lng, geofencing_radius',
      )
      .eq('code', code)
      .single();

    if (eventError || !event) {
      return jsonResponse({ error: 'Event not found' }, 404);
    }

    if (event.status !== 'active') {
      return jsonResponse({ error: 'Event is not active' }, 404);
    }

    // Fetch form fields (public fields only — exclude is_contact_field/contact_type)
    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields')
      .select('id, label, field_type, is_required, options, sort_order')
      .eq('event_id', event.id)
      .order('sort_order', { ascending: true });

    if (fieldsError) {
      return jsonResponse({ error: 'Failed to load form fields' }, 500);
    }

    return jsonResponse(
      {
        id: event.id,
        name: event.name,
        type: event.type,
        status: event.status,
        privacy_notice_url: event.privacy_notice_url,
        photo_source: event.photo_source,
        geofencing_enabled: event.geofencing_enabled ?? false,
        geofencing_lat: event.geofencing_lat ?? null,
        geofencing_lng: event.geofencing_lng ?? null,
        geofencing_radius: event.geofencing_radius ?? null,
        form_fields: fields ?? [],
      },
      200,
    );
  } catch {
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
