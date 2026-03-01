import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PhotoStatus } from '@activacom/shared/types';
import {
  getEventPhotoCounts,
  getPendingPhotos,
  moderatePhoto,
  type PendingPhotoWithContact,
} from '@/lib/api/photos';
import { photoKeys } from '@/lib/query-keys';
import { supabase } from '@/lib/supabase';

export function useEventPhotoCounts(eventId: string, enabled = true) {
  return useQuery({
    queryKey: photoKeys.counts(eventId),
    queryFn: () => getEventPhotoCounts(eventId),
    enabled,
  });
}

export function usePendingPhotos(eventId: string) {
  return useQuery({
    queryKey: photoKeys.pending(eventId),
    queryFn: () => getPendingPhotos(eventId),
    enabled: !!eventId,
  });
}

interface ModeratePhotoInput {
  photoId: string;
  status: PhotoStatus;
  moderatedBy: string;
}

export function useModeratePhoto(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ photoId, status, moderatedBy }: ModeratePhotoInput) =>
      moderatePhoto(photoId, status, moderatedBy),
    onMutate: async ({ photoId }) => {
      await queryClient.cancelQueries({ queryKey: photoKeys.pending(eventId) });

      const previous = queryClient.getQueryData<PendingPhotoWithContact[]>(
        photoKeys.pending(eventId)
      );

      queryClient.setQueryData<PendingPhotoWithContact[]>(
        photoKeys.pending(eventId),
        (old) => (old ?? []).filter((p) => p.id !== photoId)
      );

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(photoKeys.pending(eventId), context.previous);
      }
      toast.error('Error al moderar foto');
    },
    onSuccess: (_data, { status }) => {
      toast.success(status === 'approved' ? 'Foto aprobada' : 'Foto rechazada');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: photoKeys.pending(eventId) });
      queryClient.invalidateQueries({ queryKey: photoKeys.counts(eventId) });
    },
  });
}

export function usePhotosRealtime(eventId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`photos:event:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: photoKeys.pending(eventId) });
          queryClient.invalidateQueries({ queryKey: photoKeys.counts(eventId) });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'photos',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status;
          if (newStatus !== 'pending') {
            const photoId = (payload.new as { id: string }).id;
            queryClient.setQueryData<PendingPhotoWithContact[]>(
              photoKeys.pending(eventId),
              (old) => (old ?? []).filter((p) => p.id !== photoId)
            );
          }
          queryClient.invalidateQueries({ queryKey: photoKeys.counts(eventId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient]);
}
