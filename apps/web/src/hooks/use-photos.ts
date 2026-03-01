import { useQuery } from '@tanstack/react-query';
import { getEventPhotoCounts } from '@/lib/api/photos';
import { photoKeys } from '@/lib/query-keys';

export function useEventPhotoCounts(eventId: string, enabled = true) {
  return useQuery({
    queryKey: photoKeys.counts(eventId),
    queryFn: () => getEventPhotoCounts(eventId),
    enabled,
  });
}
