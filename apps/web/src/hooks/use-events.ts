import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  activateEvent,
  closeEvent,
  archiveEvent,
  deleteEvent,
} from '@/lib/api/events';
import { eventKeys, dashboardKeys, type EventFilters } from '@/lib/query-keys';
import type { EventInsert, EventUpdate } from '@activacom/shared/types';

export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => getEvents(filters),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => getEvent(id),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<EventInsert, 'id' | 'created_at' | 'updated_at'>) =>
      createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      toast.success('Evento creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al crear evento', { description: error.message });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EventUpdate }) =>
      updateEvent(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(data.id) });
      toast.success('Evento actualizado');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar evento', { description: error.message });
    },
  });
}

export function useActivateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateEvent(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      toast.success('Evento activado');
    },
    onError: (error: Error) => {
      toast.error('Error al activar evento', { description: error.message });
    },
  });
}

export function useCloseEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => closeEvent(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      toast.success('Evento cerrado');
    },
    onError: (error: Error) => {
      toast.error('Error al cerrar evento', { description: error.message });
    },
  });
}

export function useArchiveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveEvent(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      toast.success('Evento archivado');
    },
    onError: (error: Error) => {
      toast.error('Error al archivar evento', { description: error.message });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      toast.success('Evento eliminado');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar evento', { description: error.message });
    },
  });
}
