import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  Radio,
  TrendingUp,
  Plus,
  Download,
  ClipboardList,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Papa from 'papaparse';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  useDashboardStats,
  useRegistrationChart,
  useRecentRegistrations,
} from '@/hooks/use-dashboard';
import { getAllContacts } from '@/lib/api/dashboard';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useRegistrationChart();
  const { data: recentRegistrations, isLoading: recentLoading } =
    useRecentRegistrations();

  async function handleExportContacts() {
    try {
      const contacts = await getAllContacts();
      if (contacts.length === 0) {
        toast.info('No hay contactos para exportar');
        return;
      }
      const csv = Papa.unparse(
        contacts.map((c) => ({
          Nombre: c.first_name ?? '',
          Apellido: c.last_name ?? '',
          Email: c.email ?? '',
          Teléfono: c.phone ?? '',
          'Opt-in marketing': c.marketing_opt_in ? 'Sí' : 'No',
          'Fecha registro': c.created_at,
        }))
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contactos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Contactos exportados');
    } catch {
      toast.error('Error al exportar contactos');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total contactos
            </CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.totalContacts ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eventos realizados
            </CardTitle>
            <CalendarCheck className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.eventsCompleted ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evento activo</CardTitle>
            <Radio className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : stats?.activeEvent ? (
              <Link
                to={`/events/${stats.activeEvent.id}`}
                className="text-primary text-2xl font-bold hover:underline"
              >
                {stats.activeEvent.name}
              </Link>
            ) : (
              <div className="text-muted-foreground text-2xl font-bold">
                —
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Registros evento activo
            </CardTitle>
            <TrendingUp className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.activeEvent
                  ? stats.activeEventRegistrations
                  : '—'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Registros últimos 30 días</CardTitle>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : chartData && chartData.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) =>
                    format(new Date(value), 'd MMM', { locale: es })
                  }
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  labelFormatter={(value) =>
                    format(new Date(value as string), "d 'de' MMMM yyyy", {
                      locale: es,
                    })
                  }
                  formatter={(value) => [value, 'Registros']}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-muted-foreground flex h-[300px] items-center justify-center">
              Sin registros en los últimos 30 días
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent registrations */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos registros</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentRegistrations && recentRegistrations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email / Teléfono</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRegistrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      {[reg.contact.first_name, reg.contact.last_name]
                        .filter(Boolean)
                        .join(' ') || '—'}
                    </TableCell>
                    <TableCell>
                      {reg.contact.email ?? reg.contact.phone ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/events/${reg.event.id}`}
                        className="text-primary hover:underline"
                      >
                        {reg.event.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(reg.created_at), "d MMM yyyy, HH:mm", {
                        locale: es,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8">
              <ClipboardList className="size-10 opacity-50" />
              <p>No hay registros aún</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate('/events/new')}>
          <Plus className="mr-2 size-4" />
          Crear nuevo evento
        </Button>
        <Button variant="outline" onClick={() => navigate('/contacts')}>
          <Users className="mr-2 size-4" />
          Ver contactos
        </Button>
        <Button variant="outline" onClick={handleExportContacts}>
          <Download className="mr-2 size-4" />
          Exportar contactos
        </Button>
      </div>
    </div>
  );
}
