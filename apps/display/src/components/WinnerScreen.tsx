import type { DisplayEventState } from '@activacom/shared/types';

interface WinnerScreenProps {
  winner: NonNullable<DisplayEventState['winner']>;
  eventName: string;
}

export function WinnerScreen({ winner, eventName }: WinnerScreenProps) {
  const name = [winner.contact.first_name, winner.contact.last_name]
    .filter(Boolean)
    .join(' ') || 'Participante';

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <p className="mb-4 text-sm font-medium tracking-[0.3em] text-white/30 uppercase">
        {eventName}
      </p>

      <p className="mb-6 text-2xl font-semibold text-yellow-400">
        🎉 Ganador 🎉
      </p>

      <h1 className="mb-8 text-center text-7xl font-extrabold text-white">
        {name}
      </h1>

      <div className="h-1 w-32 rounded-full bg-yellow-400/40" />
    </div>
  );
}
