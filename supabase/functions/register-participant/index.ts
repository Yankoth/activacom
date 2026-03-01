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
    const {
      event_code,
      form_data,
      privacy_accepted,
      marketing_opt_in,
      turnstile_token,
    } = await req.json();

    // 2. Validate required fields
    if (!event_code || typeof event_code !== 'string') {
      return jsonResponse({ error: 'event_code is required' }, 400);
    }
    if (privacy_accepted !== true) {
      return jsonResponse(
        { error: 'Privacy notice must be accepted' },
        400,
      );
    }
    if (!form_data || typeof form_data !== 'object') {
      return jsonResponse({ error: 'form_data is required' }, 400);
    }

    // 3. Verify Turnstile CAPTCHA
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (turnstileSecret) {
      if (!turnstile_token || typeof turnstile_token !== 'string') {
        return jsonResponse({ error: 'turnstile_token is required' }, 400);
      }

      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        '';

      const turnstileRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: turnstile_token,
            remoteip: ip,
          }),
        },
      );
      const turnstileData = await turnstileRes.json();

      if (!turnstileData.success) {
        return jsonResponse({ error: 'Captcha verification failed' }, 403);
      }
    }

    // 4. Create Supabase client with service_role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5. Find event by code
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, tenant_id, status')
      .eq('code', event_code)
      .single();

    if (eventError || !event) {
      return jsonResponse(
        { error: 'Event not found or not active' },
        404,
      );
    }
    if (event.status !== 'active') {
      return jsonResponse(
        { error: 'Event not found or not active' },
        404,
      );
    }

    // 6. Rate limit by IP (max 10 registrations per IP per hour)
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    if (clientIp !== 'unknown') {
      const oneHourAgo = new Date(
        Date.now() - 60 * 60 * 1000,
      ).toISOString();

      const { count, error: rlError } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', clientIp)
        .gte('created_at', oneHourAgo);

      if (!rlError && count !== null && count >= 10) {
        return jsonResponse(
          { error: 'Too many registrations. Please try again later.' },
          429,
        );
      }
    }

    // 7. Fetch contact fields to extract email/phone/name from form_data
    const { data: contactFields } = await supabase
      .from('form_fields')
      .select('id, contact_type')
      .eq('event_id', event.id)
      .eq('is_contact_field', true);

    let email: string | null = null;
    let phone: string | null = null;
    let firstName: string | null = null;
    let lastName: string | null = null;

    if (contactFields) {
      for (const field of contactFields) {
        const value = form_data[field.id];
        if (!value || typeof value !== 'string') continue;

        const trimmed = value.trim();
        if (!trimmed) continue;

        switch (field.contact_type) {
          case 'email':
            email = trimmed.toLowerCase();
            break;
          case 'phone':
            phone = trimmed;
            break;
          case 'name': {
            const spaceIndex = trimmed.indexOf(' ');
            if (spaceIndex > 0) {
              firstName = trimmed.slice(0, spaceIndex);
              lastName = trimmed.slice(spaceIndex + 1).trim();
            } else {
              firstName = trimmed;
              lastName = null;
            }
            break;
          }
        }
      }
    }

    // Must have at least email or phone (contacts table constraint)
    if (!email && !phone) {
      return jsonResponse(
        { error: 'At least an email or phone number is required' },
        400,
      );
    }

    // 8. Dedup contact — find existing or create new
    let contact: { id: string; first_name: string | null; last_name: string | null; marketing_opt_in: boolean } | null = null;
    let isReturning = false;

    if (email) {
      const { data } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, marketing_opt_in')
        .eq('tenant_id', event.tenant_id)
        .eq('email', email)
        .single();
      if (data) contact = data;
    }

    if (!contact && phone) {
      const { data } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, marketing_opt_in')
        .eq('tenant_id', event.tenant_id)
        .eq('phone', phone)
        .single();
      if (data) contact = data;
    }

    if (contact) {
      isReturning = true;

      // Update name if provided and changed
      const updates: Record<string, unknown> = {};
      if (firstName && firstName !== contact.first_name) {
        updates.first_name = firstName;
      }
      if (lastName !== undefined && lastName !== contact.last_name) {
        updates.last_name = lastName;
      }
      // Update email/phone if the contact didn't have them
      if (email) updates.email = email;
      if (phone) updates.phone = phone;

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('contacts')
          .update(updates)
          .eq('id', contact.id);
      }
    } else {
      // Create new contact
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          tenant_id: event.tenant_id,
          email,
          phone,
          first_name: firstName,
          last_name: lastName,
          marketing_opt_in: marketing_opt_in === true,
        })
        .select('id, first_name, last_name, marketing_opt_in')
        .single();

      if (contactError || !newContact) {
        console.error('Failed to create contact:', contactError);
        return jsonResponse({ error: 'Internal server error' }, 500);
      }
      contact = newContact;
    }

    // 9. Check duplicate registration (same event + same contact)
    const { data: existingReg } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', event.id)
      .eq('contact_id', contact.id)
      .single();

    if (existingReg) {
      const contactName = [contact.first_name, contact.last_name]
        .filter(Boolean)
        .join(' ') || null;
      return jsonResponse(
        { already_registered: true, contact_name: contactName },
        409,
      );
    }

    // 10. Create registration
    const userAgent = req.headers.get('user-agent') ?? null;

    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: event.id,
        contact_id: contact.id,
        form_data,
        privacy_accepted: true,
        marketing_opt_in: marketing_opt_in === true,
        ip_address: clientIp !== 'unknown' ? clientIp : null,
        user_agent: userAgent,
      })
      .select('id')
      .single();

    if (regError || !registration) {
      console.error('Failed to create registration:', regError);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }

    // 11. Update marketing_opt_in on contact — only upgrade, never downgrade
    if (marketing_opt_in === true && !contact.marketing_opt_in) {
      await supabase
        .from('contacts')
        .update({ marketing_opt_in: true })
        .eq('id', contact.id);
    }

    // 12. Return success
    return jsonResponse(
      {
        success: true,
        registration_id: registration.id,
        contact_id: contact.id,
        is_returning: isReturning,
      },
      201,
    );
  } catch (err) {
    console.error('register-participant error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
