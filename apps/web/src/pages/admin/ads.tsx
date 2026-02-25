import { ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAdsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Publicidad</h1>

      <Card>
        <CardHeader>
          <CardTitle>Anuncios</CardTitle>
          <CardDescription>Gestiona los anuncios que se muestran en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ImageIcon className="text-muted-foreground mb-4 size-12" />
          <h3 className="mb-2 text-lg font-semibold">Sin anuncios</h3>
          <p className="text-muted-foreground text-sm">
            Crea anuncios para mostrar en las pantallas de eventos.
          </p>
          <Skeleton className="mt-4 h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}
