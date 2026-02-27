import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trophy } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useContactDetail, useUpdateContactOptOut } from '@/hooks/use-contacts';

interface ContactDetailSheetProps {
  contactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailSheet({
  contactId,
  open,
  onOpenChange,
}: ContactDetailSheetProps) {
  const { data: contact, isLoading } = useContactDetail(contactId);
  const optOutMutation = useUpdateContactOptOut();

  function handleOptOutToggle(checked: boolean) {
    if (!contactId) return;
    optOutMutation.mutate({ id: contactId, optedOut: checked });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        {isLoading ? (
          <SheetHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-6 h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </SheetHeader>
        ) : contact ? (
          <>
            <SheetHeader>
              <SheetTitle>
                {contact.first_name} {contact.last_name}
              </SheetTitle>
              <SheetDescription>
                Registrado el{' '}
                {format(new Date(contact.created_at), "d 'de' MMMM yyyy", {
                  locale: es,
                })}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 px-4">
              {/* Contact info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20">Email:</span>
                  <span>{contact.email ?? '—'}</span>
                  {contact.email_verified && (
                    <Badge variant="default" className="bg-green-600 text-xs">
                      Verificado
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20">Telefono:</span>
                  <span>{contact.phone ?? '—'}</span>
                  {contact.phone_verified && (
                    <Badge variant="default" className="bg-green-600 text-xs">
                      Verificado
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20">Marketing:</span>
                  {contact.opted_out ? (
                    <Badge variant="destructive">Baja</Badge>
                  ) : contact.marketing_opt_in ? (
                    <Badge variant="default" className="bg-green-600">Si</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </div>
              </div>

              {/* Opt-out toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Dado de baja</p>
                  <p className="text-muted-foreground text-xs">
                    El contacto no recibira comunicaciones
                  </p>
                </div>
                <Switch
                  checked={contact.opted_out}
                  onCheckedChange={handleOptOutToggle}
                  disabled={optOutMutation.isPending}
                />
              </div>

              <Separator />

              {/* Event history */}
              <div>
                <h4 className="mb-3 text-sm font-semibold">
                  Historial de eventos ({contact.event_count})
                </h4>
                {contact.registrations.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Sin participaciones</p>
                ) : (
                  <div className="space-y-2">
                    {contact.registrations.map((reg) => {
                      const won = contact.wins.some(
                        (w) => w.event_id === reg.event_id
                      );
                      return (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between rounded-md border p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/events/${reg.event_id}`}
                              className="text-sm font-medium hover:underline"
                              onClick={() => onOpenChange(false)}
                            >
                              {reg.event.name}
                            </Link>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {reg.event.type === 'raffle'
                                  ? 'Rifa'
                                  : 'PhotoDrop'}
                              </Badge>
                              <span className="text-muted-foreground text-xs">
                                {format(new Date(reg.created_at), 'd MMM yyyy', {
                                  locale: es,
                                })}
                              </span>
                            </div>
                          </div>
                          {won && (
                            <Badge
                              variant="default"
                              className="ml-2 bg-amber-500 text-xs"
                            >
                              <Trophy className="mr-1 size-3" />
                              Ganador
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
