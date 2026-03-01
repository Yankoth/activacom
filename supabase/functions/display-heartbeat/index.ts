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
    const { session_token } = await req.json();

    // 2. Validate input
    if (!session_token || typeof session_token !== 'string') {
      return jsonResponse({ error: 'session_token is required' }, 400);
    }

    // 3. Create Supabase client with service_role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Find active session by token
    const { data: session, error: findError } = await supabase
      .from('display_sessions')
      .select('id')
      .eq('session_token', session_token)
      .eq('is_active', true)
      .single();

    if (findError || !session) {
      return jsonResponse({ error: 'Session not found or revoked' }, 401);
    }

    // 5. Update heartbeat
    const { error: updateError } = await supabase
      .from('display_sessions')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('id', session.id);

    if (updateError) {
      console.error('Failed to update heartbeat:', updateError);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    console.error('display-heartbeat error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
