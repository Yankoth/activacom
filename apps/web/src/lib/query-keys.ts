import type { EventStatus } from '@activacom/shared/types';

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
