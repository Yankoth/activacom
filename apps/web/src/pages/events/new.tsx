import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/events">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo evento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuracion del evento</CardTitle>
          <CardDescription>
            El formulario de creacion de eventos estara disponible pronto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
