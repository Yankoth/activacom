import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventStatusBadge } from './event-status-badge';
import { EventActions } from './event-actions';
import type { EventWithFormFields } from '@/lib/api/events';

interface EventHeaderProps {
  event: EventWithFormFields;
  onSelectWinner?: () => void;
}

export function EventHeader({ event, onSelectWinner }: EventHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/events">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
            <EventStatusBadge status={event.status} />
          </div>
          {event.description && (
            <p className="text-muted-foreground mt-1 text-sm">{event.description}</p>
          )}
        </div>
      </div>
      <EventActions event={event} onSelectWinner={onSelectWinner} />
    </div>
  );
}
