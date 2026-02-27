import { AlertCircle } from 'lucide-react';
import { PageShell } from './PageShell';

interface ErrorScreenProps {
  title: string;
  message?: string;
}

export function ErrorScreen({ title, message }: ErrorScreenProps) {
  return (
    <PageShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {message && <p className="text-sm text-gray-500">{message}</p>}
      </div>
    </PageShell>
  );
}
