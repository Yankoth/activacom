import { ImageOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EventModerationTabProps {
  eventId: string;
}

export function EventModerationTab({ eventId: _eventId }: EventModerationTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageOff className="size-5" />
          Panel de moderacion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Aqui podras aprobar o rechazar las fotos enviadas por los participantes. Proximamente.
        </p>
      </CardContent>
    </Card>
  );
}
