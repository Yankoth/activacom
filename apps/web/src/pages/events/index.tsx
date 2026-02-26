import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EventsTable, EventsEmptyState, EventsLoading } from '@/components/events';
import { useEvents } from '@/hooks/use-events';
import type { EventStatus } from '@activacom/shared/types';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activo' },
  { value: 'closed', label: 'Cerrado' },
  { value: 'archived', label: 'Archivado' },
];

export default function EventsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filters = {
    status: statusFilter !== 'all' ? (statusFilter as EventStatus) : undefined,
    search: search || undefined,
  };

  const { data: events, isLoading } = useEvents(filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
        <Button asChild>
          <Link to="/events/new">
            <Plus className="mr-2 size-4" />
            Crear evento
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <EventsLoading />
      ) : !events || events.length === 0 ? (
        <EventsEmptyState />
      ) : (
        <Card>
          <CardContent className="p-0">
            <EventsTable events={events} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
