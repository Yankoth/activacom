import { useState, useEffect, useRef } from 'react';

interface PhotoCarouselProps {
  photoUrl: string | null;
  eventName: string;
}

export function PhotoCarousel({ photoUrl, eventName }: PhotoCarouselProps) {
  const [displayedUrl, setDisplayedUrl] = useState<string | null>(photoUrl);
  const [fadingOutUrl, setFadingOutUrl] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (photoUrl === displayedUrl) return;

    // Start crossfade
    setFadingOutUrl(displayedUrl);
    setDisplayedUrl(photoUrl);
    setIsTransitioning(true);

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFadingOutUrl(null);
      setIsTransitioning(false);
    }, 700);

    return () => clearTimeout(timeoutRef.current);
  }, [photoUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!photoUrl && !displayedUrl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <p className="mb-2 text-sm font-medium tracking-[0.3em] text-white/30 uppercase">
          {eventName}
        </p>
        <p className="text-xl text-white/50">
          Esperando fotos...
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Fading out photo */}
      {fadingOutUrl && isTransitioning && (
        <img
          src={fadingOutUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ease-in-out"
          style={{ opacity: 0 }}
        />
      )}

      {/* Current photo */}
      {displayedUrl && (
        <img
          src={displayedUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ease-in-out"
          style={{ opacity: 1 }}
        />
      )}
    </div>
  );
}
