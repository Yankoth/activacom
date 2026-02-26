import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createEventSchema, type CreateEventFormData } from '@/lib/validations/event';
import { generateEventCode } from '@/lib/generate-code';
import { useCreateEvent } from '@/hooks/use-events';
import { useCreateFormFields } from '@/hooks/use-form-fields';
import { useAuthStore } from '@/stores/auth-store';
import { StepBasicInfo } from './step-basic-info';
import { StepFormFields } from './step-form-fields';
import { StepPrivacy } from './step-privacy';
import { StepOptions } from './step-options';
import type { CreateFormFieldInput } from '@activacom/shared/types';

const STEPS = [
  { title: 'Informacion basica', description: 'Nombre, tipo y modo QR del evento' },
  { title: 'Formulario', description: 'Campos que llenaran los participantes' },
  { title: 'Privacidad', description: 'Aviso de privacidad (LFPDPPP)' },
  { title: 'Opciones', description: 'Geofencing, display y fechas' },
] as const;

const STEP_FIELDS: Record<number, (keyof CreateEventFormData)[]> = {
  0: ['name', 'type', 'qr_mode'],
  2: ['privacy_notice_url'],
  3: [],
};

export function CreateEventStepper() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formFields, setFormFields] = useState<CreateFormFieldInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tenant = useAuthStore((s) => s.tenant);
  const createEvent = useCreateEvent();
  const createFormFields = useCreateFormFields();

  const form = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'raffle',
      qr_mode: 'rotating',
      privacy_notice_url: '',
      geofencing_enabled: false,
      display_photo_duration: 5,
      max_display_sessions: 3,
      starts_at: '',
      ends_at: '',
    },
  });

  async function goNext() {
    // Validate current step fields
    const fieldsToValidate = STEP_FIELDS[currentStep];
    if (fieldsToValidate && fieldsToValidate.length > 0) {
      const valid = await form.trigger(fieldsToValidate);
      if (!valid) return;
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(data: CreateEventFormData) {
    if (!tenant) {
      toast.error('No se encontro el tenant');
      return;
    }

    setIsSubmitting(true);
    try {
      const code = generateEventCode();
      const event = await createEvent.mutateAsync({
        tenant_id: tenant.id,
        name: data.name,
        description: data.description || null,
        type: data.type,
        code,
        qr_mode: data.qr_mode,
        photo_source: data.type === 'photo_drop' ? (data.photo_source ?? 'both') : null,
        geofencing_enabled: data.geofencing_enabled ?? false,
        geofencing_lat: data.geofencing_enabled ? (data.geofencing_lat ?? null) : null,
        geofencing_lng: data.geofencing_enabled ? (data.geofencing_lng ?? null) : null,
        geofencing_radius: data.geofencing_enabled ? (data.geofencing_radius ?? null) : null,
        privacy_notice_url: data.privacy_notice_url || null,
        display_photo_duration: data.display_photo_duration ?? 5,
        max_display_sessions: data.max_display_sessions ?? 3,
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
      });

      // Create form fields
      const validFields = formFields.filter((f) => f.label.trim());
      if (validFields.length > 0) {
        await createFormFields.mutateAsync({
          eventId: event.id,
          fields: validFields.map((f, i) => ({ ...f, sort_order: i })),
        });
      }

      navigate(`/events/${event.id}`);
    } catch {
      // Error toasts already handled by mutation hooks
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Step indicators */}
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${
                  i === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : i < currentStep
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 ${i < currentStep ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
            <CardDescription>{STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 0 && <StepBasicInfo />}
            {currentStep === 1 && (
              <StepFormFields fields={formFields} onChange={setFormFields} />
            )}
            {currentStep === 2 && <StepPrivacy />}
            {currentStep === 3 && <StepOptions />}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-2 size-4" />
            Anterior
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Siguiente
              <ChevronRight className="ml-2 size-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear evento'
              )}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
