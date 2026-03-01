import type { AuthorizeDisplayResponse } from '@activacom/shared/types';
import { useHeartbeat } from '../hooks/useHeartbeat';

interface DisplayScreenProps {
  sessionToken: string;
  event: AuthorizeDisplayResponse['event'];
  onSessionExpired: () => void;
}

export function DisplayScreen({ sessionToken, event, onSessionExpired }: DisplayScreenProps) {
  const { isConnected } = useHeartbeat(sessionToken, { onSessionExpired });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4">
      <div className="text-center">
        <p className="mb-4 text-sm font-medium tracking-widest text-white/40 uppercase">
          ActivaCom
        </p>

        <h1 className="mb-8 text-4xl font-bold text-white">
          {event.name}
        </h1>

        <div className="mb-6 flex items-center justify-center gap-2">
          <span
            className={`inline-block h-3 w-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
            }`}
          />
          <span className="text-lg text-white/70">
            {isConnected ? 'Conectado' : 'Reconectando...'}
          </span>
        </div>

        <p className="text-white/50">
          Pantalla lista
        </p>
      </div>
    </div>
  );
}
