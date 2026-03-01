import { useState, useMemo, useEffect } from 'react';
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
import { StepPhotoConfig } from './step-photo-config';
import { StepOptions } from './step-options';
import { getDefaultFormFields } from '@/components/forms/default-fields';
import type { CreateFormFieldInput } from '@activacom/shared/types';

interface StepDef {
  title: string;
  description: string;
}

const BASE_STEPS: StepDef[] = [
  { title: 'Informacion basica', description: 'Nombre, tipo y modo QR del evento' },
  { title: 'Formulario', description: 'Campos que llenaran los participantes' },
  { title: 'Privacidad', description: 'Aviso de privacidad (LFPDPPP)' },
];

const PHOTO_STEP: StepDef = {
  title: 'Fotos',
  description: 'Configuracion de fotos para PhotoDrop',
};

const OPTIONS_STEP: StepDef = {
  title: 'Opciones',
  description: 'Geofencing, display y fechas',
};

function getSteps(eventType: string): StepDef[] {
  if (eventType === 'photo_drop') {
    return [...BASE_STEPS, PHOTO_STEP, OPTIONS_STEP];
  }
  return [...BASE_STEPS, OPTIONS_STEP];
}

function getStepFields(eventType: string): Record<number, (keyof CreateEventFormData)[]> {
  if (eventType === 'photo_drop') {
    return {
      0: ['name', 'type', 'qr_mode'],
      2: ['privacy_notice_url'],
      3: [],
      4: [],
    };
  }
  return {
    0: ['name', 'type', 'qr_mode'],
    2: ['privacy_notice_url'],
    3: [],
  };
}

export function CreateEventStepper() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formFields, setFormFields] = useState<CreateFormFieldInput[]>(getDefaultFormFields);
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
      photo_source: 'both',
      require_photo: false,
      display_photo_duration: 5,
      geofencing_enabled: false,
      max_display_sessions: 3,
      starts_at: '',
      ends_at: '',
    },
  });

  const eventType = form.watch('type');

  const steps = useMemo(() => getSteps(eventType), [eventType]);
  const stepFields = useMemo(() => getStepFields(eventType), [eventType]);

  // Clamp currentStep when event type changes and reduces step count
  useEffect(() => {
    if (currentStep >= steps.length) {
      setCurrentStep(steps.length - 1);
    }
  }, [steps.length, currentStep]);

  // Determine which component to render for each step index
  function getStepComponent(stepIndex: number) {
    const stepTitle = steps[stepIndex]?.title;
    switch (stepTitle) {
      case 'Informacion basica':
        return <StepBasicInfo />;
      case 'Formulario':
        return <StepFormFields fields={formFields} onChange={setFormFields} />;
      case 'Privacidad':
        return <StepPrivacy />;
      case 'Fotos':
        return <StepPhotoConfig />;
      case 'Opciones':
        return <StepOptions />;
      default:
        return null;
    }
  }

  async function goNext() {
    const fieldsToValidate = stepFields[currentStep];
    if (fieldsToValidate && fieldsToValidate.length > 0) {
      const valid = await form.trigger(fieldsToValidate);
      if (!valid) return;
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
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
      const isPhotoDrop = data.type === 'photo_drop';
      const event = await createEvent.mutateAsync({
        tenant_id: tenant.id,
        name: data.name,
        description: data.description || null,
        type: data.type,
        code,
        qr_mode: data.qr_mode,
        photo_source: isPhotoDrop ? (data.photo_source ?? 'both') : null,
        require_photo: isPhotoDrop ? (data.require_photo ?? false) : false,
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
      <div>
        {/* Step indicators */}
        <div className="mb-6 flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-center gap-2">
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
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 w-8 ${i < currentStep ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {getStepComponent(currentStep)}
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

          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Siguiente
              <ChevronRight className="ml-2 size-4" />
            </Button>
          ) : (
            <Button type="button" disabled={isSubmitting} onClick={form.handleSubmit(onSubmit)}>
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
      </div>
    </FormProvider>
  );
}
