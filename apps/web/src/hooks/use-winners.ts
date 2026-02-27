import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SelectWinnerInput } from '@activacom/shared/types';
import { getEventWinners, selectWinner } from '@/lib/api/winners';
import { winnerKeys, eventKeys } from '@/lib/query-keys';

export function useEventWinners(eventId: string) {
  return useQuery({
    queryKey: winnerKeys.list(eventId),
    queryFn: () => getEventWinners(eventId),
    enabled: !!eventId,
  });
}

export function useSelectWinner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SelectWinnerInput) => selectWinner(input),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: winnerKeys.list(input.event_id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(input.event_id) });
      toast.success('Ganador seleccionado');
    },
    onError: (error: Error) => {
      toast.error('Error al seleccionar ganador', { description: error.message });
    },
  });
}
