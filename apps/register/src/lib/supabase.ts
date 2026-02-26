import { createClient } from '@supabase/supabase-js';
import type {
  Database,
  RegisterParticipantInput,
  RegisterParticipantResponse,
  UploadPhotoResponse,
  EventPublicData,
} from '@activacom/shared/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: false },
});

export async function fetchEventByCode(code: string): Promise<EventPublicData> {
  const { data, error } = await supabase.functions.invoke<EventPublicData>(
    'get-event-public',
    { body: { code } },
  );
  if (error || !data) {
    throw new Error(error?.message ?? 'Event not found');
  }
  return data;
}

export async function resolveSlugToEvent(slug: string): Promise<{ event_code: string } | null> {
  const { data, error } = await supabase.functions.invoke<{ event_code: string }>(
    'resolve-slug',
    { body: { slug } },
  );
  if (error || !data) return null;
  return data;
}

export async function registerParticipant(
  input: RegisterParticipantInput,
): Promise<RegisterParticipantResponse> {
  const { data, error } = await supabase.functions.invoke<RegisterParticipantResponse>(
    'register-participant',
    { body: input },
  );
  if (error || !data) {
    throw new Error(error?.message ?? 'Registration failed');
  }
  return data;
}

export async function uploadPhoto(
  registrationId: string,
  eventId: string,
  file: File,
): Promise<UploadPhotoResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('registration_id', registrationId);
  formData.append('event_id', eventId);

  const { data, error } = await supabase.functions.invoke<UploadPhotoResponse>(
    'upload-photo',
    { body: formData },
  );
  if (error || !data) {
    throw new Error(error?.message ?? 'Photo upload failed');
  }
  return data;
}
