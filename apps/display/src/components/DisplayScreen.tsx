import type { AuthorizeDisplayResponse } from '@activacom/shared/types';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { useDisplayState } from '../hooks/useDisplayState';
import { usePhotoQueue } from '../hooks/usePhotoQueue';
import { PlaceholderScreen } from './PlaceholderScreen';
import { PhotoCarousel } from './PhotoCarousel';
import { WinnerScreen } from './WinnerScreen';
import { QROverlay } from './QROverlay';

interface DisplayScreenProps {
  sessionToken: string;
  event: AuthorizeDisplayResponse['event'];
  eventCode: string;
  onSessionExpired: () => void;
}

export function DisplayScreen({ sessionToken, event, eventCode, onSessionExpired }: DisplayScreenProps) {
  const { isConnected } = useHeartbeat(sessionToken, { onSessionExpired });
  const { displayState, statePayload } = useDisplayState(event.id);
  const { currentPhotoUrl } = usePhotoQueue(event.id, {
    photoDuration: event.display_photo_duration ?? 8,
  });

  const showQR = displayState === 'PLACEHOLDER' || displayState === 'PHOTOS';

  function renderContent() {
    switch (displayState) {
      case 'PHOTOS':
        return <PhotoCarousel photoUrl={currentPhotoUrl} eventName={event.name} />;

      case 'WINNER':
        if (statePayload.winner) {
          return <WinnerScreen winner={statePayload.winner} eventName={event.name} />;
        }
        return <PlaceholderScreen eventName={event.name} />;

      case 'IDLE':
        return (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <p className="text-sm font-medium tracking-[0.3em] text-white/20 uppercase">
              ActivaCom
            </p>
          </div>
        );

      case 'PLACEHOLDER':
      default:
        return <PlaceholderScreen eventName={event.name} />;
    }
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {renderContent()}

      {showQR && <QROverlay eventCode={eventCode} />}

      {!isConnected && (
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 backdrop-blur-sm">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-yellow-500" />
          <span className="text-sm text-white/70">Reconectando...</span>
        </div>
      )}
    </div>
  );
}
