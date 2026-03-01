import { useState, useCallback } from 'react';
import type { AuthorizeDisplayResponse } from '@activacom/shared/types';
import { authorizeDisplay } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';
import { DisplayScreen } from './components/DisplayScreen';

type Phase = 'auth' | 'display' | 'error';

function parseEventCode(): string | null {
  const path = window.location.pathname.replace(/^\/+/, '');
  const segment = path.split('/')[0];
  return segment || null;
}

export function App() {
  const [eventCode] = useState(() => parseEventCode());
  const [phase, setPhase] = useState<Phase>(eventCode ? 'auth' : 'error');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(
    eventCode ? null : 'No se encontro el codigo del evento en la URL',
  );
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [event, setEvent] = useState<AuthorizeDisplayResponse['event'] | null>(null);

  const handleAuthorize = useCallback(
    async (code: string) => {
      if (!eventCode) return;
      setIsConnecting(true);
      setError(null);
      try {
        const result = await authorizeDisplay({
          device_code: code,
          event_code: eventCode,
        });
        setSessionToken(result.session_token);
        setEvent(result.event);
        setPhase('display');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al conectar');
        setPhase('auth');
      } finally {
        setIsConnecting(false);
      }
    },
    [eventCode],
  );

  const handleSessionExpired = useCallback(() => {
    setSessionToken(null);
    setEvent(null);
    setError('La sesion ha expirado. Ingresa un nuevo codigo.');
    setPhase('auth');
  }, []);

  if (phase === 'error' || (phase === 'auth' && !eventCode)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4">
        <p className="text-lg text-red-400">
          {error || 'URL invalida'}
        </p>
      </div>
    );
  }

  if (phase === 'display' && sessionToken && event) {
    return (
      <DisplayScreen
        sessionToken={sessionToken}
        event={event}
        eventCode={eventCode!}
        onSessionExpired={handleSessionExpired}
      />
    );
  }

  return (
    <AuthScreen
      onAuthorize={handleAuthorize}
      isConnecting={isConnecting}
      error={error}
    />
  );
}
