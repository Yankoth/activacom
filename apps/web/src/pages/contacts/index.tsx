import { useState, useDeferredValue, useCallback } from 'react';
import { Download, Search } from 'lucide-react';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ContactsTable,
  ContactsPagination,
  ContactDetailSheet,
  ContactsEmptyState,
  ContactsLoading,
} from '@/components/contacts';
import { useContacts } from '@/hooks/use-contacts';
import { useEvents } from '@/hooks/use-events';
import { getAllFilteredContacts } from '@/lib/api/contacts';
import type { ContactFilters } from '@/lib/query-keys';

const PAGE_SIZE = 20;

export default function ContactsPage() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [marketingFilter, setMarketingFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filters: ContactFilters = {
    search: deferredSearch || undefined,
    marketingOptIn:
      marketingFilter === 'yes'
        ? true
        : marketingFilter === 'no'
          ? false
          : undefined,
    verified:
      verifiedFilter !== 'all'
        ? (verifiedFilter as 'email' | 'phone')
        : undefined,
    eventId: eventFilter !== 'all' ? eventFilter : undefined,
  };

  const { data, isLoading } = useContacts(filters, page);
  const { data: events } = useEvents();

  const resetPage = useCallback(() => setPage(0), []);

  function handleSelectContact(id: string) {
    setSelectedContactId(id);
    setSheetOpen(true);
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const contacts = await getAllFilteredContacts(filters);
      const csvData = contacts.map((c) => ({
        Nombre: c.first_name ?? '',
        Apellido: c.last_name ?? '',
        Email: c.email ?? '',
        Telefono: c.phone ?? '',
        'Email verificado': c.email_verified ? 'Si' : 'No',
        'Telefono verificado': c.phone_verified ? 'Si' : 'No',
        'Opt-in marketing': c.marketing_opt_in ? 'Si' : 'No',
        'Dado de baja': c.opted_out ? 'Si' : 'No',
        Eventos: c.event_count,
        'Fecha registro': format(new Date(c.created_at), 'yyyy-MM-dd HH:mm'),
      }));
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contactos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const hasFilters =
    deferredSearch || marketingFilter !== 'all' || verifiedFilter !== 'all' || eventFilter !== 'all';
  const isEmpty = !isLoading && data?.count === 0 && !hasFilters;
  const noResults = !isLoading && data?.count === 0 && hasFilters;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Contactos</h1>
        <Button
          variant="outline"
          onClick={handleExportCsv}
          disabled={exporting || isEmpty}
        >
          <Download className="mr-2 size-4" />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nombre, email o telefono..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={marketingFilter}
          onValueChange={(v) => {
            setMarketingFilter(v);
            resetPage();
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Marketing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Marketing: Todos</SelectItem>
            <SelectItem value="yes">Opt-in: Si</SelectItem>
            <SelectItem value="no">Opt-in: No</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={verifiedFilter}
          onValueChange={(v) => {
            setVerifiedFilter(v);
            resetPage();
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Verificado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Verificado: Todos</SelectItem>
            <SelectItem value="email">Email verificado</SelectItem>
            <SelectItem value="phone">Telefono verificado</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={eventFilter}
          onValueChange={(v) => {
            setEventFilter(v);
            resetPage();
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Evento: Todos</SelectItem>
            {events?.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <ContactsLoading />
      ) : isEmpty ? (
        <ContactsEmptyState />
      ) : noResults ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="text-muted-foreground mb-4 size-12" />
            <h3 className="mb-2 text-lg font-semibold">Sin resultados</h3>
            <p className="text-muted-foreground text-sm">
              No se encontraron contactos con los filtros aplicados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <ContactsTable
                contacts={data!.data}
                onSelectContact={handleSelectContact}
              />
            </CardContent>
          </Card>
          <ContactsPagination
            page={page}
            totalCount={data!.count}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Detail Sheet */}
      <ContactDetailSheet
        contactId={selectedContactId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
