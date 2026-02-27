import type { Contact } from '@activacom/shared/types';
import { supabase } from '@/lib/supabase';
import type { ContactFilters } from '@/lib/query-keys';

export interface ContactWithEventCount extends Contact {
  event_count: number;
}

export interface PaginatedContacts {
  data: ContactWithEventCount[];
  count: number;
}

export interface ContactRegistration {
  id: string;
  event_id: string;
  created_at: string;
  marketing_opt_in: boolean;
  event: { id: string; name: string; type: string; status: string };
}

export interface ContactDetail extends Contact {
  event_count: number;
  registrations: ContactRegistration[];
  wins: Array<{
    id: string;
    event_id: string;
    selected_at: string;
    event: { id: string; name: string };
  }>;
}

const PAGE_SIZE_DEFAULT = 20;

async function applyContactFilters(
  filters?: ContactFilters
): Promise<string[] | null> {
  if (!filters?.eventId) return null;

  const { data, error } = await supabase
    .from('event_registrations')
    .select('contact_id')
    .eq('event_id', filters.eventId);

  if (error) throw error;
  return (data ?? []).map((r) => r.contact_id);
}

export async function getContacts(
  filters?: ContactFilters,
  page = 0,
  pageSize = PAGE_SIZE_DEFAULT
): Promise<PaginatedContacts> {
  const contactIds = await applyContactFilters(filters);

  // If filtering by event and no contacts found, return empty
  if (contactIds !== null && contactIds.length === 0) {
    return { data: [], count: 0 };
  }

  let query = supabase
    .from('contacts')
    .select('*, event_registrations(count)', { count: 'exact' });

  if (filters?.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`
    );
  }

  if (filters?.marketingOptIn !== undefined) {
    query = query.eq('marketing_opt_in', filters.marketingOptIn);
  }

  if (filters?.verified === 'email') {
    query = query.eq('email_verified', true);
  } else if (filters?.verified === 'phone') {
    query = query.eq('phone_verified', true);
  }

  if (contactIds !== null) {
    query = query.in('id', contactIds);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const contacts: ContactWithEventCount[] = (data ?? []).map((row) => {
    const { event_registrations, ...contact } = row as unknown as Contact & {
      event_registrations: [{ count: number }];
    };
    return {
      ...contact,
      event_count: event_registrations?.[0]?.count ?? 0,
    };
  });

  return { data: contacts, count: count ?? 0 };
}

export async function getAllFilteredContacts(
  filters?: ContactFilters
): Promise<ContactWithEventCount[]> {
  const contactIds = await applyContactFilters(filters);

  if (contactIds !== null && contactIds.length === 0) {
    return [];
  }

  let query = supabase
    .from('contacts')
    .select('*, event_registrations(count)');

  if (filters?.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`
    );
  }

  if (filters?.marketingOptIn !== undefined) {
    query = query.eq('marketing_opt_in', filters.marketingOptIn);
  }

  if (filters?.verified === 'email') {
    query = query.eq('email_verified', true);
  } else if (filters?.verified === 'phone') {
    query = query.eq('phone_verified', true);
  }

  if (contactIds !== null) {
    query = query.in('id', contactIds);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const { event_registrations, ...contact } = row as unknown as Contact & {
      event_registrations: [{ count: number }];
    };
    return {
      ...contact,
      event_count: event_registrations?.[0]?.count ?? 0,
    };
  });
}

export async function getContactDetail(id: string): Promise<ContactDetail> {
  const [contactRes, registrationsRes, winnersRes] = await Promise.all([
    supabase
      .from('contacts')
      .select('*, event_registrations(count)')
      .eq('id', id)
      .single(),
    supabase
      .from('event_registrations')
      .select('id, event_id, created_at, marketing_opt_in, events(id, name, type, status)')
      .eq('contact_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('event_winners')
      .select('id, event_id, selected_at, events(id, name)')
      .eq('contact_id', id)
      .order('selected_at', { ascending: false }),
  ]);

  if (contactRes.error) throw contactRes.error;
  if (registrationsRes.error) throw registrationsRes.error;
  if (winnersRes.error) throw winnersRes.error;

  const { event_registrations, ...contact } = contactRes.data as unknown as Contact & {
    event_registrations: [{ count: number }];
  };

  const registrations: ContactRegistration[] = (registrationsRes.data ?? []).map((r) => ({
    id: r.id,
    event_id: r.event_id,
    created_at: r.created_at,
    marketing_opt_in: r.marketing_opt_in,
    event: r.events as unknown as ContactRegistration['event'],
  }));

  const wins = (winnersRes.data ?? []).map((w) => ({
    id: w.id,
    event_id: w.event_id,
    selected_at: w.selected_at,
    event: w.events as unknown as { id: string; name: string },
  }));

  return {
    ...contact,
    event_count: event_registrations?.[0]?.count ?? 0,
    registrations,
    wins,
  };
}

export async function updateContactOptOut(
  id: string,
  optedOut: boolean
): Promise<Contact> {
  const updateData: Record<string, boolean> = { opted_out: optedOut };
  if (optedOut) {
    updateData.marketing_opt_in = false;
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
