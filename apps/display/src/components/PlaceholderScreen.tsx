interface PlaceholderScreenProps {
  eventName: string;
}

export function PlaceholderScreen({ eventName }: PlaceholderScreenProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <p className="mb-6 text-sm font-medium tracking-[0.3em] text-white/30 uppercase">
        ActivaCom
      </p>
      <h1 className="mb-4 text-center text-6xl font-bold text-white">
        {eventName}
      </h1>
      <div className="h-1 w-24 rounded-full bg-white/20" />
    </div>
  );
}
