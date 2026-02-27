import type { EventWinner, Contact, SelectWinnerInput, SelectWinnerResponse } from '@activacom/shared/types';
import { supabase } from '@/lib/supabase';

export interface WinnerWithContact extends EventWinner {
  contact: Contact;
}

export async function getEventWinners(
  eventId: string
): Promise<WinnerWithContact[]> {
  const { data, error } = await supabase
    .from('event_winners')
    .select('*, contacts(*)')
    .eq('event_id', eventId)
    .order('selected_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    contact: (row as unknown as { contacts: Contact }).contacts,
  }));
}

export async function selectWinner(
  input: SelectWinnerInput
): Promise<SelectWinnerResponse> {
  const { data, error } = await supabase.functions.invoke('select-winner', {
    body: input,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data as SelectWinnerResponse;
}
