import { CheckCircle } from 'lucide-react';
import { PageShell } from './PageShell';
import { AdBanner } from './AdBanner';

interface AlreadyRegisteredProps {
  contactName: string | null;
  eventName: string;
}

export function AlreadyRegistered({
  contactName,
  eventName,
}: AlreadyRegisteredProps) {
  return (
    <PageShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <CheckCircle className="h-14 w-14 text-green-500" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-gray-900">
            Ya estas registrado
          </h1>
          <p className="text-sm text-gray-500">
            {contactName ? (
              <>
                <span className="font-medium text-gray-700">{contactName}</span>
                , ya estas participando en{' '}
              </>
            ) : (
              <>Ya estas participando en </>
            )}
            <span className="font-medium text-gray-700">{eventName}</span>.
          </p>
        </div>

        <div className="mt-6 w-full">
          <AdBanner />
        </div>
      </div>
    </PageShell>
  );
}
