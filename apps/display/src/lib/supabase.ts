import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import type {
  Database,
  Photo,
  AuthorizeDisplayInput,
  AuthorizeDisplayResponse,
  DisplayEventState,
} from '@activacom/shared/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: false },
});

// ── Edge Function helpers ───────────────────────────────────────────────────

export async function authorizeDisplay(
  input: AuthorizeDisplayInput,
): Promise<AuthorizeDisplayResponse> {
  const { data, error } = await supabase.functions.invoke<AuthorizeDisplayResponse>(
    'authorize-display',
    { body: input },
  );
  if (error || !data) {
    throw new Error(error?.message ?? 'Display authorization failed');
  }
  return data;
}

export async function sendHeartbeat(sessionToken: string): Promise<void> {
  const { error } = await supabase.functions.invoke('display-heartbeat', {
    body: { session_token: sessionToken },
  });
  if (error) {
    throw new Error(error.message ?? 'Heartbeat failed');
  }
}

// ── Realtime subscriptions ──────────────────────────────────────────────────

export function subscribeToPhotos(
  eventId: string,
  callbacks: {
    onNewPhoto: (photo: Photo) => void;
    onPhotoRemoved: (photoId: string) => void;
    onError?: (error: Error) => void;
  },
): () => void {
  let channel: RealtimeChannel;

  try {
    channel = supabase
      .channel(`photos:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const photo = payload.new as Photo;
          if (photo.status === 'approved') {
            callbacks.onNewPhoto(photo);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'photos',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const photo = payload.new as Photo;
          if (photo.status === 'approved') {
            callbacks.onNewPhoto(photo);
          } else if (photo.status === 'rejected') {
            callbacks.onPhotoRemoved(photo.id);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'photos',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const old = payload.old as { id?: string };
          if (old.id) {
            callbacks.onPhotoRemoved(old.id);
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          callbacks.onError?.(new Error('Photo subscription channel error'));
        }
      });
  } catch (err) {
    callbacks.onError?.(err instanceof Error ? err : new Error('Photo subscription failed'));
    return () => {};
  }

  return () => {
    supabase.removeChannel(channel);
  };
}

// ── Data fetching ───────────────────────────────────────────────────────────

export async function getApprovedPhotos(eventId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch approved photos:', error);
    return [];
  }
  return data ?? [];
}

export function getPhotoPublicUrl(storagePath: string): string {
  return supabase.storage.from('photos').getPublicUrl(storagePath).data.publicUrl;
}

// ── Realtime subscriptions ──────────────────────────────────────────────────

export function subscribeToEventState(
  eventId: string,
  callback: (state: DisplayEventState) => void,
): () => void {
  const channel = supabase
    .channel(`display-state:${eventId}`)
    .on('broadcast', { event: 'display_state' }, (payload) => {
      callback(payload.payload as DisplayEventState);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
