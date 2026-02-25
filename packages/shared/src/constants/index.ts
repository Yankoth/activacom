import type { EventType, EventStatus } from '../types';

export const EVENT_TYPES: EventType[] = ['raffle', 'photo_drop'];

export const EVENT_STATUSES: EventStatus[] = ['draft', 'active', 'closed', 'archived'];

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
