import { Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EventDisplayControlTabProps {
  eventId: string;
}

export function EventDisplayControlTab({ eventId: _eventId }: EventDisplayControlTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="size-5" />
          Control de pantalla
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Aqui podras controlar la pantalla de display del evento. Proximamente.
        </p>
      </CardContent>
    </Card>
  );
}
