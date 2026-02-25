import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Contactos</h1>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="text-muted-foreground mb-4 size-12" />
          <h3 className="mb-2 text-lg font-semibold">Sin contactos</h3>
          <p className="text-muted-foreground text-sm">
            Los contactos apareceran aqui cuando los participantes se registren en tus eventos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
