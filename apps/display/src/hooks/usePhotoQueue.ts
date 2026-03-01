import { useState, useEffect, useRef, useCallback } from 'react';
import type { Photo } from '@activacom/shared/types';
import { getApprovedPhotos, getPhotoPublicUrl, subscribeToPhotos } from '../lib/supabase';

interface UsePhotoQueueOptions {
  photoDuration?: number;
}

export function usePhotoQueue(
  eventId: string,
  options?: UsePhotoQueueOptions,
): {
  currentPhoto: Photo | null;
  currentPhotoUrl: string | null;
  photoCount: number;
  isLoading: boolean;
} {
  const duration = (options?.photoDuration ?? 8) * 1000;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  // Initial fetch
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const data = await getApprovedPhotos(eventId);
      if (!cancelled) {
        setPhotos(data);
        setCurrentIndex(0);
        setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [eventId]);

  // Realtime subscription
  const handleNewPhoto = useCallback((photo: Photo) => {
    setPhotos((prev) => {
      if (prev.some((p) => p.id === photo.id)) return prev;
      return [...prev, photo];
    });
  }, []);

  const handlePhotoRemoved = useCallback((photoId: string) => {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === photoId);
      if (idx === -1) return prev;
      const next = prev.filter((p) => p.id !== photoId);
      return next;
    });
    setCurrentIndex((prev) => {
      const current = photosRef.current;
      const removedIdx = current.findIndex((p) => p.id === photoId);
      if (removedIdx === -1) return prev;
      const newLength = current.length - 1;
      if (newLength === 0) return 0;
      if (prev >= newLength) return 0;
      if (removedIdx < prev) return prev - 1;
      return prev;
    });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToPhotos(eventId, {
      onNewPhoto: handleNewPhoto,
      onPhotoRemoved: handlePhotoRemoved,
    });

    return unsubscribe;
  }, [eventId, handleNewPhoto, handlePhotoRemoved]);

  // Cycling interval
  useEffect(() => {
    if (photos.length <= 1) return;

    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photosRef.current.length);
    }, duration);

    return () => clearInterval(id);
  }, [photos.length, duration]);

  const currentPhoto = photos.length > 0 ? photos[currentIndex % photos.length] ?? null : null;
  const currentPhotoUrl = currentPhoto ? getPhotoPublicUrl(currentPhoto.storage_path) : null;

  return {
    currentPhoto,
    currentPhotoUrl,
    photoCount: photos.length,
    isLoading,
  };
}
