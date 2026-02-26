import type { EventRegistration, Contact } from '@activacom/shared/types';
import { supabase } from '@/lib/supabase';

export interface RegistrationWithContact extends EventRegistration {
  contact: Contact;
}

export async function getEventRegistrations(
  eventId: string
): Promise<RegistrationWithContact[]> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*, contacts(*)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r) => ({
    ...r,
    contact: (r as unknown as { contacts: Contact }).contacts,
  }));
}
