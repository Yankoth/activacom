import { useState, useEffect } from 'react';
import { Monitor, Plus, Trash2, Copy, Info, Layout, Image, Trophy, MonitorOff } from 'lucide-react';
import { toast } from 'sonner';
import type { DisplayState, DisplayEventState } from '@activacom/shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useDisplaySessions,
  useGenerateDeviceCode,
  useRevokeDisplaySession,
} from '@/hooks/use-display-sessions';
import { useEventWinners } from '@/hooks/use-winners';
import type { GenerateDeviceCodeResult } from '@/lib/api/display-sessions';
import { broadcastDisplayState } from '@/lib/api/display-sessions';

interface EventDisplayControlTabProps {
  eventId: string;
  eventCode: string;
}

const DISPLAY_URL = import.meta.env.VITE_DISPLAY_URL || 'https://display.activacom.mx';

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return '0:00';
  const mins = Math.floor(diff / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function heartbeatStatus(lastHeartbeat: string): 'online' | 'warning' | 'offline' {
  const elapsed = Date.now() - new Date(lastHeartbeat).getTime();
  if (elapsed < 60_000) return 'online';
  if (elapsed < 120_000) return 'warning';
  return 'offline';
}

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return `hace ${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  return `hace ${hours}h`;
}

export function EventDisplayControlTab({ eventId, eventCode }: EventDisplayControlTabProps) {
  const { data: sessions, isLoading } = useDisplaySessions(eventId);
  const generateMutation = useGenerateDeviceCode(eventId);
  const revokeMutation = useRevokeDisplaySession(eventId);
  const { data: winners } = useEventWinners(eventId);

  const [pendingCode, setPendingCode] = useState<GenerateDeviceCodeResult | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [activeState, setActiveState] = useState<DisplayState>('PLACEHOLDER');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const hasConnectedScreens = !!sessions && sessions.length > 0;
  const hasWinners = !!winners && winners.length > 0;
  const lastWinner = hasWinners ? winners[winners.length - 1] : null;

  // Countdown timer for pending code
  useEffect(() => {
    if (!pendingCode) return;

    const update = () => {
      const diff = new Date(pendingCode.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setPendingCode(null);
        setTimeLeft('');
        return;
      }
      setTimeLeft(formatTimeLeft(pendingCode.expires_at));
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [pendingCode]);

  const handleGenerate = async () => {
    const result = await generateMutation.mutateAsync();
    setPendingCode(result);
  };

  const handleStateChange = async (state: DisplayState) => {
    setIsBroadcasting(true);
    try {
      const payload: DisplayEventState = { display_state: state };

      if (state === 'WINNER' && lastWinner) {
        payload.winner = {
          ...lastWinner,
          contact: {
            first_name: lastWinner.contact.first_name,
            last_name: lastWinner.contact.last_name,
          },
        };
      }

      await broadcastDisplayState(eventId, payload);
      setActiveState(state);
    } catch {
      toast.error('Error al cambiar estado de pantalla');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const displayUrl = `${DISPLAY_URL}/${eventCode}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(displayUrl);
    toast.success('URL copiada');
  };

  const stateButtons: { state: DisplayState; label: string; icon: typeof Layout; disabledReason?: string }[] = [
    { state: 'PLACEHOLDER', label: 'Placeholder', icon: Layout },
    { state: 'PHOTOS', label: 'Mostrar fotos', icon: Image },
    { state: 'WINNER', label: 'Ganador', icon: Trophy, disabledReason: !hasWinners ? 'No hay ganadores' : undefined },
    { state: 'IDLE', label: 'Apagar', icon: MonitorOff },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: Generate code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="size-5" />
            Generar codigo de pantalla
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingCode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <span className="font-mono text-5xl font-bold tracking-[0.3em] text-foreground">
                  {pendingCode.device_code}
                </span>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Expira en <span className="font-mono font-medium">{timeLeft}</span>
              </p>
              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                <code className="flex-1 truncate text-sm">{displayUrl}</code>
                <Button variant="ghost" size="icon" onClick={copyUrl}>
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
              >
                <Plus className="mr-2 size-4" />
                Generar codigo de pantalla
              </Button>
              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                <code className="flex-1 truncate text-sm">{displayUrl}</code>
                <Button variant="ghost" size="icon" onClick={copyUrl}>
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Display state control */}
      <Card>
        <CardHeader>
          <CardTitle>Control de pantalla</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stateButtons.map(({ state, label, icon: Icon, disabledReason }) => {
              const isActive = activeState === state;
              const isDisabled = isBroadcasting || !hasConnectedScreens || !!disabledReason;
              return (
                <Button
                  key={state}
                  variant={isActive ? 'default' : 'outline'}
                  className="flex h-auto flex-col gap-1.5 py-3"
                  disabled={isDisabled}
                  title={!hasConnectedScreens ? 'No hay pantallas conectadas' : disabledReason}
                  onClick={() => handleStateChange(state)}
                >
                  <Icon className="size-5" />
                  <span className="text-xs">{label}</span>
                </Button>
              );
            })}
          </div>
          {!hasConnectedScreens && (
            <p className="mt-3 text-xs text-muted-foreground">
              Conecta al menos una pantalla para controlar el display.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Connected screens */}
      <Card>
        <CardHeader>
          <CardTitle>Pantallas conectadas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : !sessions || sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay pantallas conectadas
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const status = heartbeatStatus(session.last_heartbeat);
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          status === 'online'
                            ? 'bg-green-500'
                            : status === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      />
                      <div>
                        <span className="font-mono text-sm font-medium">
                          {session.device_code}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Heartbeat: {timeAgo(session.last_heartbeat)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          status === 'online'
                            ? 'default'
                            : status === 'warning'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {status === 'online' ? 'En linea' : status === 'warning' ? 'Lento' : 'Sin respuesta'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => revokeMutation.mutate(session.id)}
                        disabled={revokeMutation.isPending}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-5" />
            Instrucciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Abre la URL <code className="rounded bg-muted px-1">{displayUrl}</code> en la pantalla/proyector
            </li>
            <li>
              Haz clic en &quot;Generar codigo de pantalla&quot; para obtener un codigo de 6 digitos
            </li>
            <li>
              Ingresa el codigo en la pantalla del display para conectarla
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
