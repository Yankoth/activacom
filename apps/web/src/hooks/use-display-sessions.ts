import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getDisplaySessions,
  generateDeviceCode,
  revokeDisplaySession,
} from '@/lib/api/display-sessions';
import { displaySessionKeys } from '@/lib/query-keys';

export function useDisplaySessions(eventId: string) {
  return useQuery({
    queryKey: displaySessionKeys.list(eventId),
    queryFn: () => getDisplaySessions(eventId),
    enabled: !!eventId,
    refetchInterval: 30_000,
  });
}

export function useGenerateDeviceCode(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateDeviceCode(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: displaySessionKeys.list(eventId) });
      toast.success('Codigo generado');
    },
    onError: (error: Error) => {
      toast.error('Error al generar codigo', { description: error.message });
    },
  });
}

export function useRevokeDisplaySession(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => revokeDisplaySession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: displaySessionKeys.list(eventId) });
      toast.success('Sesion revocada');
    },
    onError: (error: Error) => {
      toast.error('Error al revocar sesion', { description: error.message });
    },
  });
}
