import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getContacts,
  getContactDetail,
  updateContactOptOut,
} from '@/lib/api/contacts';
import { contactKeys, type ContactFilters } from '@/lib/query-keys';

export function useContacts(filters?: ContactFilters, page = 0) {
  return useQuery({
    queryKey: contactKeys.list(filters, page),
    queryFn: () => getContacts(filters, page),
    placeholderData: (prev) => prev,
  });
}

export function useContactDetail(contactId: string | null) {
  return useQuery({
    queryKey: contactKeys.detail(contactId!),
    queryFn: () => getContactDetail(contactId!),
    enabled: !!contactId,
  });
}

export function useUpdateContactOptOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, optedOut }: { id: string; optedOut: boolean }) =>
      updateContactOptOut(id, optedOut),
    onSuccess: (_, { id, optedOut }) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(id) });
      toast.success(optedOut ? 'Contacto dado de baja' : 'Contacto reactivado');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar contacto', { description: error.message });
    },
  });
}
