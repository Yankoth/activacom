import { supabase } from '@/lib/supabase';
import { subDays, format } from 'date-fns';
import type { Contact } from '@activacom/shared/types';

export interface DashboardStats {
  totalContacts: number;
  eventsCompleted: number;
  activeEvent: { id: string; name: string; code: string } | null;
  activeEventRegistrations: number;
}

export interface RegistrationDayData {
  date: string;
  count: number;
}

export interface RecentRegistration {
  id: string;
  created_at: string;
  contact: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
  event: { id: string; name: string };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [contactsRes, eventsCompletedRes, activeEventRes] = await Promise.all([
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .in('status', ['closed', 'archived']),
    supabase
      .from('events')
      .select('id, name, code')
      .eq('status', 'active')
      .maybeSingle(),
  ]);

  if (contactsRes.error) throw contactsRes.error;
  if (eventsCompletedRes.error) throw eventsCompletedRes.error;
  if (activeEventRes.error) throw activeEventRes.error;

  let activeEventRegistrations = 0;
  if (activeEventRes.data) {
    const regRes = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', activeEventRes.data.id);

    if (regRes.error) throw regRes.error;
    activeEventRegistrations = regRes.count ?? 0;
  }

  return {
    totalContacts: contactsRes.count ?? 0,
    eventsCompleted: eventsCompletedRes.count ?? 0,
    activeEvent: activeEventRes.data,
    activeEventRegistrations,
  };
}

export async function getRegistrationsByDay(): Promise<RegistrationDayData[]> {
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  const { data, error } = await supabase
    .from('event_registrations')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at');

  if (error) throw error;

  const grouped = (data ?? []).reduce<Record<string, number>>((acc, row) => {
    const day = format(new Date(row.created_at), 'yyyy-MM-dd');
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {});

  // Fill in missing days with 0
  const result: RegistrationDayData[] = [];
  for (let i = 30; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    result.push({ date, count: grouped[date] ?? 0 });
  }

  return result;
}

export async function getRecentRegistrations(
  limit = 10
): Promise<RecentRegistration[]> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('id, created_at, contacts(first_name, last_name, email, phone), events(id, name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    contact: row.contacts as unknown as RecentRegistration['contact'],
    event: row.events as unknown as RecentRegistration['event'],
  }));
}

export async function getAllContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
