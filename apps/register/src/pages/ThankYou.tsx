import { useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { AdBanner } from '@/components/AdBanner';

export default function ThankYou() {
  const [params] = useSearchParams();
  const eventName = params.get('event');
  const isReturning = params.get('returning') === '1';

  return (
    <PageShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <CheckCircle className="h-16 w-16 text-green-500" />

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {isReturning ? 'Bienvenido de nuevo' : 'Registro exitoso'}
          </h1>
          <p className="text-sm text-gray-500">
            {eventName ? (
              <>
                {isReturning
                  ? 'Tu registro en '
                  : 'Ya estas participando en '}
                <span className="font-medium text-gray-700">{eventName}</span>.
              </>
            ) : (
              'Tu registro fue exitoso. Buena suerte.'
            )}
          </p>
        </div>

        <div className="mt-6 w-full">
          <AdBanner />
        </div>
      </div>
    </PageShell>
  );
}
