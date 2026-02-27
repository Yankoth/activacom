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
    const { slug } = await req.json();

    if (!slug || typeof slug !== 'string') {
      return jsonResponse({ error: 'Tenant slug is required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find active tenant by slug
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (tenantError || !tenant) {
      return jsonResponse({ error: 'Tenant not found' }, 404);
    }

    // Find the most recent active event for this tenant
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('code')
      .eq('tenant_id', tenant.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (eventError || !event) {
      return jsonResponse({ error: 'No active events' }, 404);
    }

    return jsonResponse({ event_code: event.code }, 200);
  } catch {
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
