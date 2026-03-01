import type { PhotoStatus } from '@activacom/shared/types';
import { supabase } from '@/lib/supabase';

export interface PhotoCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface PendingPhotoWithContact {
  id: string;
  event_id: string;
  registration_id: string;
  storage_path: string;
  thumbnail_path: string | null;
  status: string;
  created_at: string;
  participant_name: string;
}

export async function getEventPhotoCounts(eventId: string): Promise<PhotoCounts> {
  const { data, error } = await supabase
    .from('photos')
    .select('status')
    .eq('event_id', eventId);

  if (error) throw error;

  const rows = data ?? [];
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  };
}

export async function getPendingPhotos(eventId: string): Promise<PendingPhotoWithContact[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*, event_registrations!inner(contacts(first_name, last_name))')
    .eq('event_id', eventId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const reg = (row as unknown as { event_registrations: { contacts: { first_name: string; last_name: string } } }).event_registrations;
    const contact = reg.contacts;
    const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Sin nombre';

    return {
      id: row.id,
      event_id: row.event_id,
      registration_id: row.registration_id,
      storage_path: row.storage_path,
      thumbnail_path: row.thumbnail_path,
      status: row.status,
      created_at: row.created_at,
      participant_name: name,
    };
  });
}

export async function moderatePhoto(
  photoId: string,
  status: PhotoStatus,
  moderatedBy: string
) {
  const { data, error } = await supabase
    .from('photos')
    .update({
      status,
      moderated_by: moderatedBy,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', photoId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function getPhotoPublicUrl(storagePath: string): string {
  return supabase.storage.from('photos').getPublicUrl(storagePath).data.publicUrl;
}
