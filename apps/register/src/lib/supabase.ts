import type {
  RegisterParticipantInput,
  RegisterParticipantResponse,
  AlreadyRegisteredResponse,
  UploadPhotoResponse,
  EventPublicData,
  CheckParticipantInput,
  CheckParticipantResponse,
} from '@activacom/shared/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !apiKey) {
  throw new Error('Missing Supabase environment variables');
}

// ── Raw fetch helpers ────────────────────────────────────────────────────────
// sb_publishable_* keys are NOT JWTs — they must only be sent as `apikey`,
// never in the `Authorization: Bearer` header (which causes 401).

const baseHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  apikey: apiKey,
};

async function invokeFunction<T>(name: string, body: object): Promise<T> {
  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `${name} failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function fetchEventByCode(code: string): Promise<EventPublicData> {
  return invokeFunction<EventPublicData>('get-event-public', { code });
}

export async function resolveSlugToEvent(slug: string): Promise<{ event_code: string } | null> {
  try {
    return await invokeFunction<{ event_code: string }>('resolve-slug', { slug });
  } catch {
    return null;
  }
}

export async function checkParticipant(
  input: CheckParticipantInput,
): Promise<CheckParticipantResponse> {
  return invokeFunction<CheckParticipantResponse>('check-participant', input);
}

export async function registerParticipant(
  input: RegisterParticipantInput,
): Promise<RegisterParticipantResponse | AlreadyRegisteredResponse> {
  const response = await fetch(`${supabaseUrl}/functions/v1/register-participant`, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify(input),
  });

  if (response.status === 409) {
    return response.json() as Promise<AlreadyRegisteredResponse>;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Registration failed (${response.status})`);
  }

  return response.json() as Promise<RegisterParticipantResponse>;
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

  // No Content-Type header — browser sets multipart boundary automatically
  const response = await fetch(`${supabaseUrl}/functions/v1/upload-photo`, {
    method: 'POST',
    headers: { apikey: apiKey },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Photo upload failed (${response.status})`);
  }

  return response.json() as Promise<UploadPhotoResponse>;
}
