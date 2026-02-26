import type {
  Event,
  EventInsert,
  EventUpdate,
  EventStatus,
  FormField,
} from '@activacom/shared/types';
import { supabase } from '@/lib/supabase';
import type { EventFilters } from '@/lib/query-keys';

export interface EventWithCount extends Event {
  registration_count: number;
}

export interface EventWithFormFields extends Event {
  form_fields: FormField[];
  registration_count: number;
}

export async function getEvents(filters?: EventFilters): Promise<EventWithCount[]> {
  let query = supabase
    .from('events')
    .select('*, event_registrations(count)')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []).map((event) => ({
    ...event,
    registration_count:
      (event.event_registrations as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));
}

export async function getEvent(id: string): Promise<EventWithFormFields> {
  const { data, error } = await supabase
    .from('events')
    .select('*, form_fields(*), event_registrations(count)')
    .eq('id', id)
    .order('sort_order', { referencedTable: 'form_fields', ascending: true })
    .single();

  if (error) throw error;

  return {
    ...data,
    form_fields: (data.form_fields ?? []) as FormField[],
    registration_count:
      (data.event_registrations as unknown as { count: number }[])?.[0]?.count ?? 0,
  };
}

export async function createEvent(
  input: Omit<EventInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<Event> {
  const { data, error } = await supabase.from('events').insert(input).select().single();

  if (error) throw error;
  return data;
}

export async function updateEvent(
  id: string,
  input: EventUpdate
): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateEventStatus(id: string, status: EventStatus): Promise<Event> {
  return updateEvent(id, { status });
}

export async function activateEvent(id: string): Promise<Event> {
  return updateEventStatus(id, 'active');
}

export async function closeEvent(id: string): Promise<Event> {
  return updateEventStatus(id, 'closed');
}

export async function archiveEvent(id: string): Promise<Event> {
  return updateEventStatus(id, 'archived');
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}
