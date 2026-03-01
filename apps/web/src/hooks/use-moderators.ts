import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import {
  getModerators,
  inviteModerator,
  deactivateModerator,
  reactivateModerator,
} from '@/lib/api/moderators';
import { moderatorKeys } from '@/lib/query-keys';

export function useModerators() {
  const tenantId = useAuthStore((s) => s.tenant?.id);

  return useQuery({
    queryKey: moderatorKeys.list(tenantId!),
    queryFn: () => getModerators(tenantId!),
    enabled: !!tenantId,
  });
}

export function useInviteModerator() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenant?.id);

  return useMutation({
    mutationFn: (email: string) => inviteModerator(email),
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: moderatorKeys.list(tenantId) });
      }
      toast.success('Invitacion enviada');
    },
    onError: (error: Error) => {
      toast.error('Error al invitar moderador', { description: error.message });
    },
  });
}

export function useDeactivateModerator() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenant?.id);

  return useMutation({
    mutationFn: (userId: string) => deactivateModerator(userId),
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: moderatorKeys.list(tenantId) });
      }
      toast.success('Moderador desactivado');
    },
    onError: (error: Error) => {
      toast.error('Error al desactivar moderador', { description: error.message });
    },
  });
}

export function useReactivateModerator() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenant?.id);

  return useMutation({
    mutationFn: (userId: string) => reactivateModerator(userId),
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: moderatorKeys.list(tenantId) });
      }
      toast.success('Moderador reactivado');
    },
    onError: (error: Error) => {
      toast.error('Error al reactivar moderador', { description: error.message });
    },
  });
}
