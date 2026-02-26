import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getFormFields,
  createFormFields,
  updateFormField,
  deleteFormField,
} from '@/lib/api/form-fields';
import { formFieldKeys, eventKeys } from '@/lib/query-keys';
import type { FormFieldInsert, FormFieldUpdate } from '@activacom/shared/types';

export function useFormFields(eventId: string) {
  return useQuery({
    queryKey: formFieldKeys.list(eventId),
    queryFn: () => getFormFields(eventId),
    enabled: !!eventId,
  });
}

export function useCreateFormFields() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      fields,
    }: {
      eventId: string;
      fields: Omit<FormFieldInsert, 'event_id' | 'id' | 'created_at'>[];
    }) => createFormFields(eventId, fields),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: formFieldKeys.list(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      toast.success('Campos guardados');
    },
    onError: (error: Error) => {
      toast.error('Error al guardar campos', { description: error.message });
    },
  });
}

export function useUpdateFormField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      eventId,
      input,
    }: {
      id: string;
      eventId: string;
      input: FormFieldUpdate;
    }) => updateFormField(id, input),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: formFieldKeys.list(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar campo', { description: error.message });
    },
  });
}

export function useDeleteFormField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, eventId }: { id: string; eventId: string }) =>
      deleteFormField(id),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: formFieldKeys.list(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      toast.success('Campo eliminado');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar campo', { description: error.message });
    },
  });
}
