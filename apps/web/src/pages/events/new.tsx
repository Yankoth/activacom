import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateEventStepper } from '@/components/events/create';

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

      <CreateEventStepper />
    </div>
  );
}
