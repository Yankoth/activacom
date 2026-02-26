import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Users, Eye, Link2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { EventWithFormFields } from '@/lib/api/events';
import { useEventWinner } from '@/hooks/use-winners';

const REGISTER_URL = import.meta.env.VITE_REGISTER_URL || 'https://go.activacom.mx';

interface EventSummaryTabProps {
  event: EventWithFormFields;
}

export function EventSummaryTab({ event }: EventSummaryTabProps) {
  const [copied, setCopied] = useState(false);
  const { data: winner } = useEventWinner(event.id);

  const registrationUrl =
    event.qr_mode === 'fixed'
      ? `${REGISTER_URL}/r/${event.code}`
      : `${REGISTER_URL}/e/${event.code}`;

  function handleCopy() {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Stats cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Registros</CardTitle>
          <Users className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{event.registration_count}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Campos del formulario</CardTitle>
          <Eye className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{event.form_fields.length}</div>
        </CardContent>
      </Card>

      {/* QR + Link */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-4" />
            Enlace de registro
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 md:flex-row">
          <div className="rounded-lg border bg-white p-4">
            <QRCodeSVG value={registrationUrl} size={160} />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <code className="bg-muted flex-1 rounded px-3 py-2 text-sm">
                {registrationUrl}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              {event.qr_mode === 'fixed'
                ? 'QR fijo — Siempre redirige al evento activo de este tenant.'
                : 'QR por evento — URL unica para este evento.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Event details */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-4" />
            Detalles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Tipo:</span>{' '}
              {event.type === 'raffle' ? 'Rifa' : 'PhotoDrop'}
            </div>
            <div>
              <span className="text-muted-foreground">Modo QR:</span>{' '}
              {event.qr_mode === 'fixed' ? 'Fijo' : 'Rotativo'}
            </div>
            <div>
              <span className="text-muted-foreground">Codigo:</span>{' '}
              <code className="bg-muted rounded px-1">{event.code}</code>
            </div>
            <div>
              <span className="text-muted-foreground">Geofencing:</span>{' '}
              {event.geofencing_enabled ? 'Activo' : 'Inactivo'}
            </div>
            {event.starts_at && (
              <div>
                <span className="text-muted-foreground">Inicio:</span>{' '}
                {format(new Date(event.starts_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
              </div>
            )}
            {event.ends_at && (
              <div>
                <span className="text-muted-foreground">Fin:</span>{' '}
                {format(new Date(event.ends_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Aviso de privacidad:</span>{' '}
              {event.privacy_notice_url ? (
                <a
                  href={event.privacy_notice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Ver aviso
                </a>
              ) : (
                <span className="text-destructive">No configurado</span>
              )}
            </div>
          </div>

          {winner && (
            <>
              <Separator />
              <div>
                <h4 className="mb-1 font-semibold">Ganador</h4>
                <p className="text-sm">
                  {winner.contact.first_name} {winner.contact.last_name}
                  {winner.contact.email && ` — ${winner.contact.email}`}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
