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

const headers: HeadersInit = {
  'Content-Type': 'application/json',
  apikey: apiKey,
};

async function invokeFunction<T>(name: string, body: unknown): Promise<T> {
  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? `${name} failed`);
  }

  return response.json();
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
  const response = await fetch(
    `${supabaseUrl}/functions/v1/register-participant`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    },
  );

  const data = await response.json();

  if (response.status === 409) {
    return data as AlreadyRegisteredResponse;
  }

  if (!response.ok) {
    throw new Error(data.error ?? 'Registration failed');
  }

  return data as RegisterParticipantResponse;
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

  const response = await fetch(`${supabaseUrl}/functions/v1/upload-photo`, {
    method: 'POST',
    headers: { apikey: apiKey },
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? 'Photo upload failed');
  }

  return response.json();
}
