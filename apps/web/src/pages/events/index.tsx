import { Link } from 'react-router-dom';
import { CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EventsPage() {
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

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CalendarDays className="text-muted-foreground mb-4 size-12" />
          <h3 className="mb-2 text-lg font-semibold">No hay eventos</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Crea tu primer evento para empezar a capturar contactos
          </p>
          <Button asChild>
            <Link to="/events/new">
              <Plus className="mr-2 size-4" />
              Crear evento
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
