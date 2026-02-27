import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ContactWithEventCount } from '@/lib/api/contacts';

interface ContactsTableProps {
  contacts: ContactWithEventCount[];
  onSelectContact: (id: string) => void;
}

export function ContactsTable({ contacts, onSelectContact }: ContactsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefono</TableHead>
          <TableHead>Verificado</TableHead>
          <TableHead>Marketing</TableHead>
          <TableHead>Eventos</TableHead>
          <TableHead>Fecha registro</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact) => (
          <TableRow
            key={contact.id}
            className="cursor-pointer"
            onClick={() => onSelectContact(contact.id)}
          >
            <TableCell className="font-medium">
              {contact.first_name} {contact.last_name}
            </TableCell>
            <TableCell>{contact.email ?? '—'}</TableCell>
            <TableCell>{contact.phone ?? '—'}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                {contact.email_verified && (
                  <Badge variant="default" className="bg-green-600 text-xs">Email</Badge>
                )}
                {contact.phone_verified && (
                  <Badge variant="default" className="bg-green-600 text-xs">Tel</Badge>
                )}
                {!contact.email_verified && !contact.phone_verified && '—'}
              </div>
            </TableCell>
            <TableCell>
              {contact.opted_out ? (
                <Badge variant="destructive">Baja</Badge>
              ) : contact.marketing_opt_in ? (
                <Badge variant="default" className="bg-green-600">Si</Badge>
              ) : (
                <Badge variant="secondary">No</Badge>
              )}
            </TableCell>
            <TableCell>{contact.event_count}</TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(contact.created_at), 'd MMM yyyy', { locale: es })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
