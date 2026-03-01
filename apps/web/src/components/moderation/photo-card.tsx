import { Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getPhotoPublicUrl } from '@/lib/api/photos';
import type { PendingPhotoWithContact } from '@/lib/api/photos';

interface PhotoCardProps {
  photo: PendingPhotoWithContact;
  isSelected: boolean;
  onApprove: (photoId: string) => void;
  onReject: (photoId: string) => void;
  onSelect: (photoId: string) => void;
  isLoading: boolean;
}

export function PhotoCard({
  photo,
  isSelected,
  onApprove,
  onReject,
  onSelect,
  isLoading,
}: PhotoCardProps) {
  const imageUrl = getPhotoPublicUrl(photo.thumbnail_path ?? photo.storage_path);
  const timeAgo = formatDistanceToNow(new Date(photo.created_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Card
      className={cn(
        'overflow-hidden cursor-pointer transition-colors',
        isSelected && 'ring-2 ring-blue-500'
      )}
      onClick={() => onSelect(photo.id)}
    >
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={`Foto de ${photo.participant_name}`}
          className="size-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-2 space-y-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{photo.participant_name}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 min-h-10 text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              onApprove(photo.id);
            }}
          >
            <Check className="size-4 mr-1" />
            Aprobar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 min-h-10 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              onReject(photo.id);
            }}
          >
            <X className="size-4 mr-1" />
            Rechazar
          </Button>
        </div>
      </div>
    </Card>
  );
}
