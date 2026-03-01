import { useCallback, useEffect, useState } from 'react';
import { ImageOff, Keyboard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PhotoCard } from '@/components/moderation';
import { usePendingPhotos, useModeratePhoto, usePhotosRealtime } from '@/hooks/use-photos';
import { useAuthStore } from '@/stores/auth-store';

interface EventModerationTabProps {
  eventId: string;
}

function getGridColumns(): number {
  if (typeof window === 'undefined') return 4;
  if (window.innerWidth < 640) return 2;
  if (window.innerWidth < 1024) return 3;
  return 4;
}

export function EventModerationTab({ eventId }: EventModerationTabProps) {
  const user = useAuthStore((s) => s.user);
  const { data: photos, isLoading } = usePendingPhotos(eventId);
  const moderate = useModeratePhoto(eventId);
  usePhotosRealtime(eventId);

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Clamp selectedIndex when photos change
  useEffect(() => {
    if (!photos || photos.length === 0) {
      setSelectedIndex(0);
      return;
    }
    setSelectedIndex((prev) => Math.min(prev, photos.length - 1));
  }, [photos]);

  const handleApprove = useCallback(
    (photoId: string) => {
      if (!user) return;
      moderate.mutate({ photoId, status: 'approved', moderatedBy: user.id });
    },
    [user, moderate]
  );

  const handleReject = useCallback(
    (photoId: string) => {
      if (!user) return;
      moderate.mutate({ photoId, status: 'rejected', moderatedBy: user.id });
    },
    [user, moderate]
  );

  const handleSelect = useCallback(
    (photoId: string) => {
      const idx = photos?.findIndex((p) => p.id === photoId) ?? -1;
      if (idx >= 0) setSelectedIndex(idx);
    },
    [photos]
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!photos || photos.length === 0) return;

    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const cols = getGridColumns();
      const len = photos!.length;

      switch (e.key.toLowerCase()) {
        case 'a': {
          const photo = photos![selectedIndex];
          if (photo) handleApprove(photo.id);
          break;
        }
        case 'r': {
          const photo = photos![selectedIndex];
          if (photo) handleReject(photo.id);
          break;
        }
        case 'arrowleft':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(0, prev - 1));
          break;
        case 'arrowright':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(len - 1, prev + 1));
          break;
        case 'arrowup':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(0, prev - cols));
          break;
        case 'arrowdown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(len - 1, prev + cols));
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos, selectedIndex, handleApprove, handleReject]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ImageOff className="size-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No hay fotos pendientes</p>
          <p className="text-sm text-muted-foreground mt-1">
            Las fotos nuevas apareceran aqui automaticamente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge variant="secondary">
          {photos.length} foto{photos.length !== 1 ? 's' : ''} pendiente{photos.length !== 1 ? 's' : ''}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Keyboard className="size-3.5" />
          <span>
            <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">A</kbd> Aprobar
            {' '}
            <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">R</kbd> Rechazar
            {' '}
            <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">&larr;&rarr;&uarr;&darr;</kbd> Navegar
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, idx) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            isSelected={idx === selectedIndex}
            onApprove={handleApprove}
            onReject={handleReject}
            onSelect={handleSelect}
            isLoading={moderate.isPending}
          />
        ))}
      </div>
    </div>
  );
}
