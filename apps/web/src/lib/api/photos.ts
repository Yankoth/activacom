import { supabase } from '@/lib/supabase';

export interface PhotoCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
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
