import { startOfMonth } from 'date-fns';
import type {
  Tenant,
  TenantUpdate,
  Event,
  CreditTransaction,
} from '@activacom/shared/types';
import { supabase } from '@/lib/supabase';
import type { TenantFilters } from '@/lib/query-keys';

export interface AdminStats {
  totalActiveTenants: number;
  totalEvents: number;
  totalRegistrations: number;
  tenantsThisMonth: number;
}

export interface TenantWithCounts extends Tenant {
  events_count: number;
  contacts_count: number;
}

export interface TenantEventRow extends Event {
  registration_count: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const monthStart = startOfMonth(new Date()).toISOString();

  const [activeTenants, events, registrations, recentTenants] = await Promise.all([
    supabase.from('tenants').select('*', { head: true, count: 'exact' }).eq('is_active', true),
    supabase.from('events').select('*', { head: true, count: 'exact' }),
    supabase.from('event_registrations').select('*', { head: true, count: 'exact' }),
    supabase.from('tenants').select('*', { head: true, count: 'exact' }).gte('created_at', monthStart),
  ]);

  if (activeTenants.error) throw activeTenants.error;
  if (events.error) throw events.error;
  if (registrations.error) throw registrations.error;
  if (recentTenants.error) throw recentTenants.error;

  return {
    totalActiveTenants: activeTenants.count ?? 0,
    totalEvents: events.count ?? 0,
    totalRegistrations: registrations.count ?? 0,
    tenantsThisMonth: recentTenants.count ?? 0,
  };
}

export async function getTenants(filters?: TenantFilters): Promise<Tenant[]> {
  let query = supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status === 'active') {
    query = query.eq('is_active', true);
  } else if (filters?.status === 'inactive') {
    query = query.eq('is_active', false);
  }

  if (filters?.plan) {
    query = query.eq('plan', filters.plan);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getTenantDetail(id: string): Promise<TenantWithCounts> {
  const [tenantResult, eventsCount, contactsCount] = await Promise.all([
    supabase.from('tenants').select('*').eq('id', id).single(),
    supabase.from('events').select('*', { head: true, count: 'exact' }).eq('tenant_id', id),
    supabase.from('contacts').select('*', { head: true, count: 'exact' }).eq('tenant_id', id),
  ]);

  if (tenantResult.error) throw tenantResult.error;
  if (eventsCount.error) throw eventsCount.error;
  if (contactsCount.error) throw contactsCount.error;

  return {
    ...tenantResult.data,
    events_count: eventsCount.count ?? 0,
    contacts_count: contactsCount.count ?? 0,
  };
}

export async function getTenantEvents(tenantId: string): Promise<TenantEventRow[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*, event_registrations(count)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((event) => ({
    ...event,
    registration_count:
      (event.event_registrations as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));
}

export async function getTenantCreditTransactions(tenantId: string): Promise<CreditTransaction[]> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateTenant(id: string, input: TenantUpdate): Promise<Tenant> {
  const { data, error } = await supabase
    .from('tenants')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addCredits(
  tenantId: string,
  amount: number,
  description: string
): Promise<void> {
  const { data: tenant, error: fetchError } = await supabase
    .from('tenants')
    .select('credit_balance')
    .eq('id', tenantId)
    .single();

  if (fetchError) throw fetchError;

  const { error: insertError } = await supabase
    .from('credit_transactions')
    .insert({
      tenant_id: tenantId,
      amount,
      type: 'bonus',
      description,
    });

  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from('tenants')
    .update({ credit_balance: (tenant.credit_balance ?? 0) + amount })
    .eq('id', tenantId);

  if (updateError) throw updateError;
}
