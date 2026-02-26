import type { EventWinner, Contact } from '@activacom/shared/types';
import { supabase } from '@/lib/supabase';

export interface WinnerWithContact extends EventWinner {
  contact: Contact;
}

export async function getEventWinner(
  eventId: string
): Promise<WinnerWithContact | null> {
  const { data, error } = await supabase
    .from('event_winners')
    .select('*, contacts(*)')
    .eq('event_id', eventId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    contact: (data as unknown as { contacts: Contact }).contacts,
  };
}

export async function selectRandomWinner(
  eventId: string,
  selectedBy: string
): Promise<WinnerWithContact> {
  // Fetch all registration IDs for this event
  const { data: registrations, error: regError } = await supabase
    .from('event_registrations')
    .select('id, contact_id')
    .eq('event_id', eventId);

  if (regError) throw regError;
  if (!registrations || registrations.length === 0) {
    throw new Error('No hay participantes registrados');
  }

  // Pick a random registration
  const randomIndex = Math.floor(Math.random() * registrations.length);
  const winner = registrations[randomIndex];

  return insertWinner(eventId, winner.id, winner.contact_id, selectedBy);
}

export async function selectSpecificWinner(
  eventId: string,
  registrationId: string,
  selectedBy: string
): Promise<WinnerWithContact> {
  // Look up the contact_id for this registration
  const { data: registration, error: regError } = await supabase
    .from('event_registrations')
    .select('contact_id')
    .eq('id', registrationId)
    .single();

  if (regError) throw regError;

  return insertWinner(eventId, registrationId, registration.contact_id, selectedBy);
}

async function insertWinner(
  eventId: string,
  registrationId: string,
  contactId: string,
  selectedBy: string
): Promise<WinnerWithContact> {
  const { data, error } = await supabase
    .from('event_winners')
    .insert({
      event_id: eventId,
      registration_id: registrationId,
      contact_id: contactId,
      selected_by: selectedBy,
    })
    .select('*, contacts(*)')
    .single();

  if (error) throw error;

  return {
    ...data,
    contact: (data as unknown as { contacts: Contact }).contacts,
  };
}
