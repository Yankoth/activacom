import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Coins, CalendarDays, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EventStatusBadge } from '@/components/events';
import {
  useTenantDetail,
  useTenantEvents,
  useTenantCreditTransactions,
} from '@/hooks/use-admin';
import type { PlanType, TenantType, CreditTransactionType } from '@activacom/shared/types';

const PLAN_LABELS: Record<PlanType, string> = { free: 'Free', basic: 'Basic', premium: 'Premium' };
const TYPE_LABELS: Record<TenantType, string> = {
  restaurant: 'Restaurante',
  event_organizer: 'Organizador',
  band: 'Grupo musical',
};
const CREDIT_TYPE_LABELS: Record<CreditTransactionType, string> = {
  purchase: 'Compra',
  consumption: 'Consumo',
  refund: 'Reembolso',
  bonus: 'Bonus',
};

export default function AdminTenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tenant, isLoading } = useTenantDetail(id!);
  const { data: events, isLoading: eventsLoading } = useTenantEvents(id!);
  const { data: credits, isLoading: creditsLoading } = useTenantCreditTransactions(id!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/admin/tenants">
            <ArrowLeft className="mr-2 size-4" />
            Volver a tenants
          </Link>
        </Button>
        <p className="text-muted-foreground">Tenant no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/tenants">
            <ArrowLeft className="mr-2 size-4" />
            Volver a tenants
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
          <Badge variant="outline">{TYPE_LABELS[tenant.type]}</Badge>
          <Badge variant="outline">{PLAN_LABELS[tenant.plan]}</Badge>
          <Badge
            variant={tenant.is_active ? 'default' : 'secondary'}
            className={tenant.is_active ? 'bg-green-600 text-white hover:bg-green-600/90' : undefined}
          >
            {tenant.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <p className="text-muted-foreground font-mono text-sm">{tenant.slug}</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance creditos</CardTitle>
            <Coins className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.credit_balance}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total eventos</CardTitle>
            <CalendarDays className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.events_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total contactos</CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.contacts_count}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="credits">Creditos</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardContent className="p-0">
              {eventsLoading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !events || events.length === 0 ? (
                <div className="text-muted-foreground flex items-center justify-center py-12">
                  Sin eventos
                </div>
              ) : (
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
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>
                          {event.type === 'raffle' ? 'Rifa' : 'PhotoDrop'}
                        </TableCell>
                        <TableCell>
                          <EventStatusBadge status={event.status} />
                        </TableCell>
                        <TableCell>{event.registration_count}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(event.created_at), 'd MMM yyyy', { locale: es })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits">
          <Card>
            <CardContent className="p-0">
              {creditsLoading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !credits || credits.length === 0 ? (
                <div className="text-muted-foreground flex items-center justify-center py-12">
                  Sin transacciones de creditos
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Descripcion</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credits.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {CREDIT_TYPE_LABELS[tx.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              tx.amount >= 0
                                ? 'font-medium text-green-600'
                                : 'font-medium text-red-600'
                            }
                          >
                            {tx.amount >= 0 ? '+' : ''}
                            {tx.amount}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tx.description ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(tx.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
