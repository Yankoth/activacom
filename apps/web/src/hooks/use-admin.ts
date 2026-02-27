import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAdminStats,
  getTenants,
  getTenantDetail,
  getTenantEvents,
  getTenantCreditTransactions,
  updateTenant,
  addCredits,
} from '@/lib/api/admin';
import { adminKeys, adminTenantKeys, type TenantFilters } from '@/lib/query-keys';
import type { TenantUpdate } from '@activacom/shared/types';

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: getAdminStats,
    staleTime: 60_000,
  });
}

export function useAdminTenants(filters?: TenantFilters) {
  return useQuery({
    queryKey: adminTenantKeys.list(filters),
    queryFn: () => getTenants(filters),
  });
}

export function useTenantDetail(id: string) {
  return useQuery({
    queryKey: adminTenantKeys.detail(id),
    queryFn: () => getTenantDetail(id),
    enabled: !!id,
  });
}

export function useTenantEvents(tenantId: string) {
  return useQuery({
    queryKey: adminTenantKeys.events(tenantId),
    queryFn: () => getTenantEvents(tenantId),
    enabled: !!tenantId,
  });
}

export function useTenantCreditTransactions(tenantId: string) {
  return useQuery({
    queryKey: adminTenantKeys.credits(tenantId),
    queryFn: () => getTenantCreditTransactions(tenantId),
    enabled: !!tenantId,
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TenantUpdate }) =>
      updateTenant(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminTenantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminTenantKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      toast.success('Tenant actualizado');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar tenant', { description: error.message });
    },
  });
}

export function useAddCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      amount,
      description,
    }: {
      tenantId: string;
      amount: number;
      description: string;
    }) => addCredits(tenantId, amount, description),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminTenantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminTenantKeys.detail(variables.tenantId) });
      queryClient.invalidateQueries({ queryKey: adminTenantKeys.credits(variables.tenantId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      toast.success('Creditos agregados');
    },
    onError: (error: Error) => {
      toast.error('Error al agregar creditos', { description: error.message });
    },
  });
}
