import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resolveSlugToEvent } from '@/lib/supabase';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorScreen } from '@/components/ErrorScreen';

export default function SlugRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    resolveSlugToEvent(slug).then((result) => {
      if (result) {
        navigate(`/e/${result.event_code}`, { replace: true });
      } else {
        setError('No hay eventos activos en este momento.');
      }
    });
  }, [slug, navigate]);

  if (error) {
    return (
      <ErrorScreen
        title="Sin eventos activos"
        message={error}
      />
    );
  }

  return <LoadingScreen message={`Buscando evento de ${slug}...`} />;
}
