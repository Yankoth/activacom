import { Loader2 } from 'lucide-react';
import { PageShell } from './PageShell';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Cargando...' }: LoadingScreenProps) {
  return (
    <PageShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </PageShell>
  );
}
