import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, Users } from 'lucide-react';
import Papa from 'papaparse';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventRegistrations } from '@/hooks/use-registrations';

interface EventParticipantsTabProps {
  eventId: string;
  eventName: string;
}

export function EventParticipantsTab({ eventId, eventName }: EventParticipantsTabProps) {
  const { data: registrations, isLoading } = useEventRegistrations(eventId);

  const csvData = useMemo(() => {
    if (!registrations) return [];
    return registrations.map((r) => ({
      nombre: r.contact.first_name ?? '',
      apellido: r.contact.last_name ?? '',
      email: r.contact.email ?? '',
      telefono: r.contact.phone ?? '',
      email_verificado: r.contact.email_verified ? 'Si' : 'No',
      telefono_verificado: r.contact.phone_verified ? 'Si' : 'No',
      marketing_opt_in: r.marketing_opt_in ? 'Si' : 'No',
      nombre_evento: eventName,
      fecha_registro: format(new Date(r.created_at), 'yyyy-MM-dd HH:mm'),
      ...Object.fromEntries(
        Object.entries(r.form_data).map(([k, v]) => [`campo_${k}`, String(v ?? '')])
      ),
    }));
  }, [registrations]);

  function handleExportCsv() {
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventName.replace(/\s+/g, '_')}_participantes.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="text-muted-foreground mb-4 size-10" />
          <p className="text-muted-foreground text-sm">Aun no hay participantes registrados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Participantes ({registrations.length})</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="mr-2 size-4" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Marketing</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {r.contact.first_name} {r.contact.last_name}
                </TableCell>
                <TableCell>{r.contact.email ?? '—'}</TableCell>
                <TableCell>{r.contact.phone ?? '—'}</TableCell>
                <TableCell>{r.marketing_opt_in ? 'Si' : 'No'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(r.created_at), 'd MMM yyyy HH:mm', { locale: es })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
