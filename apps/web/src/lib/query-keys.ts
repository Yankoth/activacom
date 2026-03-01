import type { EventStatus, PlanType, TenantType } from '@activacom/shared/types';

export interface EventFilters {
  status?: EventStatus;
  search?: string;
}

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters?: EventFilters) => [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

export const formFieldKeys = {
  all: ['form-fields'] as const,
  lists: () => [...formFieldKeys.all, 'list'] as const,
  list: (eventId: string) => [...formFieldKeys.lists(), eventId] as const,
};

export const registrationKeys = {
  all: ['registrations'] as const,
  lists: () => [...registrationKeys.all, 'list'] as const,
  list: (eventId: string) => [...registrationKeys.lists(), eventId] as const,
};

export const winnerKeys = {
  all: ['winners'] as const,
  lists: () => [...winnerKeys.all, 'list'] as const,
  list: (eventId: string) => [...winnerKeys.lists(), eventId] as const,
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  chart: () => [...dashboardKeys.all, 'chart'] as const,
  recent: () => [...dashboardKeys.all, 'recent'] as const,
};

export interface TenantFilters {
  search?: string;
  status?: 'active' | 'inactive';
  plan?: PlanType;
  type?: TenantType;
}

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
};

export const adminTenantKeys = {
  all: ['admin-tenants'] as const,
  lists: () => [...adminTenantKeys.all, 'list'] as const,
  list: (filters?: TenantFilters) => [...adminTenantKeys.lists(), filters] as const,
  details: () => [...adminTenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminTenantKeys.details(), id] as const,
  events: (id: string) => [...adminTenantKeys.all, 'events', id] as const,
  credits: (id: string) => [...adminTenantKeys.all, 'credits', id] as const,
};

export interface ContactFilters {
  search?: string;
  marketingOptIn?: boolean;
  verified?: 'email' | 'phone';
  eventId?: string;
}

export const photoKeys = {
  all: ['photos'] as const,
  counts: (eventId: string) => [...photoKeys.all, 'counts', eventId] as const,
  pending: (eventId: string) => [...photoKeys.all, 'pending', eventId] as const,
};

export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (filters?: ContactFilters, page?: number) =>
    [...contactKeys.lists(), filters, page] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
};
