import { useQuery } from '@tanstack/react-query';
import { getEventRegistrations } from '@/lib/api/registrations';
import { registrationKeys } from '@/lib/query-keys';

export function useEventRegistrations(eventId: string) {
  return useQuery({
    queryKey: registrationKeys.list(eventId),
    queryFn: () => getEventRegistrations(eventId),
    enabled: !!eventId,
  });
}
