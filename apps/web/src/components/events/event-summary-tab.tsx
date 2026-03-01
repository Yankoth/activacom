import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Users, Eye, Link2, Calendar, Trophy, Camera, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EventWithFormFields } from '@/lib/api/events';
import { useEventWinners } from '@/hooks/use-winners';
import { useEventPhotoCounts } from '@/hooks/use-photos';

const REGISTER_URL = import.meta.env.VITE_REGISTER_URL || 'https://go.activacom.mx';

const PHOTO_SOURCE_LABELS: Record<string, string> = {
  camera: 'Camara',
  gallery: 'Galeria',
  both: 'Ambas',
};

interface EventSummaryTabProps {
  event: EventWithFormFields;
}

export function EventSummaryTab({ event }: EventSummaryTabProps) {
  const [copied, setCopied] = useState(false);
  const { data: winners } = useEventWinners(event.id);
  const isPhotoDrop = event.type === 'photo_drop';
  const { data: photoCounts } = useEventPhotoCounts(event.id, isPhotoDrop);

  const registrationUrl =
    event.qr_mode === 'fixed'
      ? `${REGISTER_URL}/r/${event.code}`
      : `${REGISTER_URL}/e/${event.code}`;

  function handleCopy() {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const showWinnersCard =
    (winners && winners.length > 0) ||
    event.status === 'active' ||
    event.status === 'closed';

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

      {/* Photo stats (photo_drop only) */}
      {isPhotoDrop && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fotos recibidas</CardTitle>
              <Camera className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{photoCounts?.total ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
              <CheckCircle className="size-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{photoCounts?.approved ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
              <XCircle className="size-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{photoCounts?.rejected ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">En cola</CardTitle>
              <Clock className="size-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{photoCounts?.pending ?? 0}</div>
            </CardContent>
          </Card>
        </>
      )}

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

      {/* Winners */}
      {showWinnersCard && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4" />
              Ganadores
              {winners && winners.length > 0 && (
                <Badge variant="secondary">{winners.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!winners || winners.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No se ha seleccionado ningun ganador.
              </p>
            ) : (
              <div className="space-y-2">
                {winners.map((winner, index) => {
                  const isLatest = index === winners.length - 1;
                  return (
                    <div
                      key={winner.id}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                        isLatest ? 'bg-primary/5' : ''
                      }`}
                    >
                      <span className="text-muted-foreground w-8 text-sm font-semibold">
                        #{index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {[winner.contact.first_name, winner.contact.last_name]
                            .filter(Boolean)
                            .join(' ') || 'Sin nombre'}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {[winner.contact.email, winner.contact.phone]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {format(new Date(winner.selected_at), "d MMM yyyy HH:mm", {
                          locale: es,
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
            {isPhotoDrop && (
              <>
                <div>
                  <span className="text-muted-foreground">Fuente de fotos:</span>{' '}
                  {event.photo_source ? PHOTO_SOURCE_LABELS[event.photo_source] : 'No configurada'}
                </div>
                <div>
                  <span className="text-muted-foreground">Foto requerida:</span>{' '}
                  {event.require_photo ? 'Si' : 'No'}
                </div>
                <div>
                  <span className="text-muted-foreground">Duracion en display:</span>{' '}
                  {event.display_photo_duration}s
                </div>
              </>
            )}
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
        </CardContent>
      </Card>
    </div>
  );
}
