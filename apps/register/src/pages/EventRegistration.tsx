import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { EventPublicData } from '@activacom/shared/types';
import {
  fetchEventByCode,
  registerParticipant,
  checkParticipant,
  uploadPhoto,
} from '@/lib/supabase';
import { isWithinRadius } from '@/lib/geo';
import { compressImage } from '@/lib/image';
import { getTurnstileToken } from '@/lib/turnstile';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorScreen } from '@/components/ErrorScreen';
import { AlreadyRegistered } from '@/components/AlreadyRegistered';
import { PageShell } from '@/components/PageShell';
import { AdBanner } from '@/components/AdBanner';
import { FormRenderer } from '@/components/FormRenderer';

type PageState =
  | { phase: 'loading' }
  | { phase: 'error'; title: string; message?: string }
  | { phase: 'geofence_requesting'; event: EventPublicData }
  | { phase: 'geofence_failed'; message: string }
  | { phase: 'form'; event: EventPublicData; prefillData?: Record<string, unknown> | null }
  | { phase: 'already_registered'; contactName: string | null; eventName: string }
  | { phase: 'submitting'; event: EventPublicData };

export default function EventRegistration() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>({ phase: 'loading' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load event data on mount
  useEffect(() => {
    if (!code) {
      setState({ phase: 'error', title: 'Evento no encontrado' });
      return;
    }

    fetchEventByCode(code)
      .then((event) => {
        if (
          event.geofencing_enabled &&
          event.geofencing_lat != null &&
          event.geofencing_lng != null &&
          event.geofencing_radius != null
        ) {
          setState({ phase: 'geofence_requesting', event });
          requestGeolocation(event);
        } else {
          setState({ phase: 'form', event });
        }
      })
      .catch(() => {
        setState({
          phase: 'error',
          title: 'Evento no disponible',
          message: 'Este evento no existe o ya no esta activo.',
        });
      });
  }, [code]);

  const requestGeolocation = useCallback((event: EventPublicData) => {
    if (!navigator.geolocation) {
      setState({
        phase: 'geofence_failed',
        message: 'Tu navegador no soporta geolocalizacion.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const withinRange = isWithinRadius(
          position.coords.latitude,
          position.coords.longitude,
          event.geofencing_lat!,
          event.geofencing_lng!,
          event.geofencing_radius!,
        );

        if (withinRange) {
          setState({ phase: 'form', event });
        } else {
          setState({
            phase: 'geofence_failed',
            message: 'Debes estar en la ubicacion del evento para registrarte.',
          });
        }
      },
      () => {
        setState({
          phase: 'geofence_failed',
          message: 'No pudimos obtener tu ubicacion. Permite el acceso a la ubicacion e intenta de nuevo.',
        });
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  // Check if participant is already registered (called from mini-check in form)
  const handleCheckParticipant = useCallback(
    async (email?: string, phone?: string) => {
      if (!code || (!email && !phone)) return;

      try {
        const result = await checkParticipant({
          event_code: code,
          email: email || undefined,
          phone: phone || undefined,
        });

        if (result.registered_in_event) {
          const currentEvent = state.phase === 'form' ? state.event : null;
          setState({
            phase: 'already_registered',
            contactName: result.contact_name,
            eventName: currentEvent?.name ?? '',
          });
        } else if (result.returning_contact && result.prefill_data) {
          // Prefill form with previous data
          const currentEvent = state.phase === 'form' ? state.event : null;
          if (currentEvent) {
            setState({
              phase: 'form',
              event: currentEvent,
              prefillData: result.prefill_data,
            });
          }
        }
      } catch {
        // Silently fail — the check is a convenience, not critical
      }
    },
    [code, state],
  );

  const handleSubmit = useCallback(
    async (data: {
      form_data: Record<string, unknown>;
      privacy_accepted: boolean;
      marketing_opt_in: boolean;
      photo?: File;
    }) => {
      if (!code || state.phase !== 'form') return;

      setIsSubmitting(true);

      try {
        // Get Turnstile token
        const turnstileToken = await getTurnstileToken();

        // Register participant
        const result = await registerParticipant({
          event_code: code,
          form_data: data.form_data,
          privacy_accepted: data.privacy_accepted,
          marketing_opt_in: data.marketing_opt_in,
          turnstile_token: turnstileToken,
        });

        // Check for already-registered response (409)
        if ('already_registered' in result) {
          setState({
            phase: 'already_registered',
            contactName: result.contact_name,
            eventName: state.event.name,
          });
          return;
        }

        // Upload photo if provided
        if (data.photo) {
          try {
            const compressed = await compressImage(data.photo);
            await uploadPhoto(result.registration_id, state.event.id, compressed);
          } catch {
            // Photo upload failed — registration still succeeded
            // In the future, we could show a warning
          }
        }

        // Navigate to thank you page
        const params = new URLSearchParams({
          event: state.event.name,
        });
        if (result.is_returning) {
          params.set('returning', '1');
        }
        navigate(`/e/${code}/thank-you?${params.toString()}`, { replace: true });
      } catch (err) {
        setIsSubmitting(false);
        // Show error inline — could be improved with a toast
        alert(err instanceof Error ? err.message : 'Error al registrarse. Intenta de nuevo.');
      }
    },
    [code, state, navigate],
  );

  // Handle contact field blur for pre-check
  const handleContactBlur = useCallback(
    (fieldType: string, value: string) => {
      if (!value.trim()) return;
      if (fieldType === 'email') {
        handleCheckParticipant(value.trim(), undefined);
      } else if (fieldType === 'phone') {
        handleCheckParticipant(undefined, value.trim());
      }
    },
    [handleCheckParticipant],
  );

  // Render based on state
  if (state.phase === 'loading') {
    return <LoadingScreen message="Cargando formulario..." />;
  }

  if (state.phase === 'error') {
    return <ErrorScreen title={state.title} message={state.message} />;
  }

  if (state.phase === 'geofence_requesting') {
    return <LoadingScreen message="Verificando tu ubicacion..." />;
  }

  if (state.phase === 'geofence_failed') {
    return (
      <ErrorScreen
        title="Fuera de rango"
        message={state.message}
      />
    );
  }

  if (state.phase === 'already_registered') {
    return (
      <AlreadyRegistered
        contactName={state.contactName}
        eventName={state.eventName}
      />
    );
  }

  // phase === 'form' or 'submitting'
  const event = state.event;

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Completa el formulario para participar
          </p>
        </div>

        <FormRenderer
          fields={event.form_fields}
          privacyNoticeUrl={event.privacy_notice_url}
          eventType={event.type}
          photoSource={event.photo_source}
          prefillData={state.phase === 'form' ? state.prefillData : null}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onContactBlur={handleContactBlur}
        />

        <AdBanner />
      </div>
    </PageShell>
  );
}
