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

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // 1. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const thumbnail = formData.get('thumbnail') as File | null;
    const registrationId = formData.get('registration_id') as string | null;
    const eventId = formData.get('event_id') as string | null;

    // 2. Validate required fields
    if (!file || !(file instanceof File)) {
      return jsonResponse({ error: 'file is required' }, 400);
    }
    if (!registrationId || typeof registrationId !== 'string') {
      return jsonResponse({ error: 'registration_id is required' }, 400);
    }
    if (!eventId || typeof eventId !== 'string') {
      return jsonResponse({ error: 'event_id is required' }, 400);
    }

    // 3. Validate file MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return jsonResponse(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        400,
      );
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        400,
      );
    }

    // 5. Validate thumbnail MIME if present (non-fatal if missing)
    if (thumbnail && thumbnail instanceof File) {
      if (!ALLOWED_MIME_TYPES.includes(thumbnail.type)) {
        // Log but don't reject — thumbnail is optional
        console.warn(`Invalid thumbnail MIME type: ${thumbnail.type}`);
      }
    }

    // 6. Create Supabase client with service_role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 7. Validate event: exists, active, photo_drop
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, tenant_id, status, type')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return jsonResponse({ error: 'Event not found' }, 404);
    }
    if (event.status !== 'active') {
      return jsonResponse({ error: 'Event is not active' }, 400);
    }
    if (event.type !== 'photo_drop') {
      return jsonResponse({ error: 'Event does not accept photos' }, 400);
    }

    // 8. Validate registration exists and belongs to event
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('id', registrationId)
      .eq('event_id', eventId)
      .single();

    if (regError || !registration) {
      return jsonResponse({ error: 'Registration not found for this event' }, 404);
    }

    // 9. Check 1 photo per registration
    const { count, error: countError } = await supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('registration_id', registrationId);

    if (!countError && count !== null && count > 0) {
      return jsonResponse({ error: 'A photo has already been uploaded for this registration' }, 409);
    }

    // 10. Upload file to Storage
    const storagePath = `${event.tenant_id}/${eventId}/${registrationId}.jpg`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload failed:', uploadError);
      return jsonResponse({ error: 'Failed to upload photo' }, 500);
    }

    // 11. Upload thumbnail if present (non-fatal if fails)
    let thumbnailPath: string | null = null;
    if (thumbnail && thumbnail instanceof File && ALLOWED_MIME_TYPES.includes(thumbnail.type)) {
      thumbnailPath = `${event.tenant_id}/${eventId}/${registrationId}_thumb.jpg`;
      const thumbBuffer = await thumbnail.arrayBuffer();

      const { error: thumbError } = await supabase.storage
        .from('photos')
        .upload(thumbnailPath, thumbBuffer, {
          contentType: thumbnail.type,
          upsert: false,
        });

      if (thumbError) {
        console.warn('Thumbnail upload failed:', thumbError);
        thumbnailPath = null;
      }
    }

    // 12. Insert into photos table
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: photo, error: insertError } = await supabase
      .from('photos')
      .insert({
        event_id: eventId,
        registration_id: registrationId,
        storage_path: storagePath,
        thumbnail_path: thumbnailPath,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (insertError || !photo) {
      console.error('Failed to insert photo record:', insertError);

      // 13. Cleanup uploaded files on insert failure
      await supabase.storage.from('photos').remove([storagePath]);
      if (thumbnailPath) {
        await supabase.storage.from('photos').remove([thumbnailPath]);
      }

      return jsonResponse({ error: 'Failed to save photo record' }, 500);
    }

    // 14. Return success
    return jsonResponse(
      {
        photo_id: photo.id,
        storage_path: storagePath,
      },
      201,
    );
  } catch (err) {
    console.error('upload-photo error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
