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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return jsonResponse({ error: 'A valid email is required' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

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

    // 3. Look up caller's tenant and role
    const { data: caller, error: callerError } = await supabase
      .from('users')
      .select('tenant_id, role, is_active')
      .eq('id', authUser.id)
      .single();

    if (callerError || !caller) {
      return jsonResponse({ error: 'User not found' }, 403);
    }
    if (!caller.is_active) {
      return jsonResponse({ error: 'Account is deactivated' }, 403);
    }
    if (caller.role !== 'tenant_admin' && caller.role !== 'super_admin') {
      return jsonResponse({ error: 'Insufficient permissions' }, 403);
    }

    const tenantId = caller.tenant_id;

    // 4. Check if the email already exists in auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail,
    );

    if (existingAuthUser) {
      // Check if they already have a row in public.users for this tenant
      const { data: existingRow } = await supabase
        .from('users')
        .select('id, role, is_active, tenant_id')
        .eq('id', existingAuthUser.id)
        .maybeSingle();

      if (existingRow && existingRow.tenant_id === tenantId) {
        if (existingRow.is_active && existingRow.role === 'moderator') {
          return jsonResponse({ error: 'Este email ya tiene una cuenta de moderador activa' }, 409);
        }
        // Reactivate if was deactivated
        if (!existingRow.is_active) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ is_active: true, role: 'moderator' })
            .eq('id', existingAuthUser.id);

          if (updateError) {
            console.error('Error reactivating moderator:', updateError);
            return jsonResponse({ error: 'Internal server error' }, 500);
          }

          return jsonResponse(
            { success: true, user_id: existingAuthUser.id, email: normalizedEmail },
            200,
          );
        }
        // Existing user with different role in same tenant
        return jsonResponse(
          { error: 'Este email ya tiene una cuenta en este tenant' },
          409,
        );
      }

      if (existingRow && existingRow.tenant_id !== tenantId) {
        // User exists in auth but belongs to another tenant — cannot reuse
        return jsonResponse(
          { error: 'Este email ya esta registrado en otra organizacion' },
          409,
        );
      }

      // Auth user exists but no public.users row for this tenant — create one
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: existingAuthUser.id,
          tenant_id: tenantId,
          role: 'moderator',
          is_active: true,
        });

      if (insertError) {
        console.error('Error creating moderator row:', insertError);
        return jsonResponse({ error: 'Internal server error' }, 500);
      }

      return jsonResponse(
        { success: true, user_id: existingAuthUser.id, email: normalizedEmail },
        201,
      );
    }

    // 5. User does not exist — invite via Supabase Auth
    const { data: inviteData, error: inviteError } =
      await supabase.auth.admin.inviteUserByEmail(normalizedEmail);

    if (inviteError || !inviteData.user) {
      console.error('Error inviting user:', inviteError);
      return jsonResponse({ error: 'Error al enviar invitacion' }, 500);
    }

    // 6. Create public.users row
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: inviteData.user.id,
        tenant_id: tenantId,
        role: 'moderator',
        is_active: true,
      });

    if (insertError) {
      console.error('Error creating moderator row:', insertError);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }

    return jsonResponse(
      { success: true, user_id: inviteData.user.id, email: normalizedEmail },
      201,
    );
  } catch (err) {
    console.error('invite-moderator error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
