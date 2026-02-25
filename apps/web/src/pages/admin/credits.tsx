import { Coins } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCreditsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Creditos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Gestion de creditos</CardTitle>
          <CardDescription>
            Administra los creditos y transacciones de los tenants.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Coins className="text-muted-foreground mb-4 size-12" />
          <h3 className="mb-2 text-lg font-semibold">Sin transacciones</h3>
          <p className="text-muted-foreground text-sm">
            Las transacciones de creditos apareceran aqui.
          </p>
          <Skeleton className="mt-4 h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}
