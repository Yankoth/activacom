import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getEventWinner, selectRandomWinner, selectSpecificWinner } from '@/lib/api/winners';
import { winnerKeys, eventKeys } from '@/lib/query-keys';

export function useEventWinner(eventId: string) {
  return useQuery({
    queryKey: winnerKeys.detail(eventId),
    queryFn: () => getEventWinner(eventId),
    enabled: !!eventId,
  });
}

export function useSelectWinner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      registrationId,
      selectedBy,
    }: {
      eventId: string;
      registrationId?: string;
      selectedBy: string;
    }) =>
      registrationId
        ? selectSpecificWinner(eventId, registrationId, selectedBy)
        : selectRandomWinner(eventId, selectedBy),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: winnerKeys.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      toast.success('Ganador seleccionado');
    },
    onError: (error: Error) => {
      toast.error('Error al seleccionar ganador', { description: error.message });
    },
  });
}
