import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EventStatusBadge } from './event-status-badge';
import type { EventWithCount } from '@/lib/api/events';

const EVENT_TYPE_LABELS: Record<string, string> = {
  raffle: 'Rifa',
  photo_drop: 'PhotoDrop',
};

interface EventsTableProps {
  events: EventWithCount[];
}

export function EventsTable({ events }: EventsTableProps) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Registros</TableHead>
          <TableHead>Creado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow
            key={event.id}
            className="cursor-pointer"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            <TableCell className="font-medium">{event.name}</TableCell>
            <TableCell>{EVENT_TYPE_LABELS[event.type] ?? event.type}</TableCell>
            <TableCell>
              <EventStatusBadge status={event.status} />
            </TableCell>
            <TableCell>
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                {event.registration_count}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(event.created_at), 'd MMM yyyy', { locale: es })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
