import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera } from 'lucide-react';
import type { EventPublicData, EventType, PhotoSource } from '@activacom/shared/types';
import { MAX_PHOTO_SIZE } from '@activacom/shared/constants';

type FormField = EventPublicData['form_fields'][number];

interface FormRendererProps {
  fields: FormField[];
  privacyNoticeUrl: string | null;
  eventType: EventType;
  photoSource: PhotoSource | null;
  prefillData?: Record<string, unknown> | null;
  onSubmit: (data: {
    form_data: Record<string, unknown>;
    privacy_accepted: boolean;
    marketing_opt_in: boolean;
    photo?: File;
  }) => Promise<void>;
  isSubmitting: boolean;
  onContactBlur?: (fieldType: string, value: string) => void;
}

function buildFormSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    const key = field.id;

    if (field.field_type === 'email') {
      shape[key] = field.is_required
        ? z.string().min(1, 'Este campo es obligatorio').email('Email invalido')
        : z.string().email('Email invalido').optional().or(z.literal(''));
    } else if (field.field_type === 'phone') {
      shape[key] = field.is_required
        ? z.string().min(1, 'Este campo es obligatorio').regex(/^\+?[\d\s()-]{7,15}$/, 'Telefono invalido')
        : z.string().regex(/^\+?[\d\s()-]{7,15}$/, 'Telefono invalido').optional().or(z.literal(''));
    } else if (field.field_type === 'number') {
      shape[key] = field.is_required
        ? z.coerce.number({ message: 'Debe ser un numero' })
        : z.union([z.coerce.number(), z.literal('')]).optional();
    } else {
      shape[key] = field.is_required
        ? z.string().min(1, 'Este campo es obligatorio')
        : z.string().optional().or(z.literal(''));
    }
  }

  shape['privacy_accepted'] = z.literal(true, {
    message: 'Debes aceptar el aviso de privacidad',
  });
  shape['marketing_opt_in'] = z.boolean().optional();

  return z.object(shape);
}

function getInputType(fieldType: string): string {
  switch (fieldType) {
    case 'email': return 'email';
    case 'phone': return 'tel';
    case 'number': return 'number';
    default: return 'text';
  }
}

function getInputMode(fieldType: string): React.HTMLAttributes<HTMLInputElement>['inputMode'] {
  switch (fieldType) {
    case 'email': return 'email';
    case 'phone': return 'tel';
    case 'number': return 'numeric';
    default: return undefined;
  }
}

function getCaptureAttr(photoSource: PhotoSource | null): 'environment' | 'user' | undefined {
  if (photoSource === 'camera') return 'environment';
  return undefined;
}

export function FormRenderer({
  fields,
  privacyNoticeUrl,
  eventType,
  photoSource,
  prefillData,
  onSubmit,
  isSubmitting,
  onContactBlur,
}: FormRendererProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');

  const schema = useMemo(() => buildFormSchema(fields), [fields]);

  const defaultValues = useMemo(() => {
    const values: Record<string, string | boolean> = {};
    for (const field of fields) {
      const prefill = prefillData?.[field.id];
      values[field.id] = typeof prefill === 'string' ? prefill : '';
    }
    values['privacy_accepted'] = false;
    values['marketing_opt_in'] = false;
    return values;
  }, [fields, prefillData]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const needsPhoto = eventType === 'photo_drop' && photoSource !== null;

  const handleFormSubmit = handleSubmit(async (data) => {
    // Honeypot check — silently "succeed" without actually registering
    if (honeypot) return;

    if (needsPhoto && !photoFile) {
      setPhotoError('Debes agregar una foto');
      return;
    }

    const formData: Record<string, unknown> = {};
    for (const field of fields) {
      formData[field.id] = data[field.id];
    }

    await onSubmit({
      form_data: formData,
      privacy_accepted: data.privacy_accepted as boolean,
      marketing_opt_in: (data.marketing_opt_in as boolean) || false,
      photo: photoFile ?? undefined,
    });
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError(null);

    if (!file) {
      setPhotoFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('El archivo debe ser una imagen');
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError('La imagen no debe superar 5MB');
      return;
    }

    setPhotoFile(file);
  };

  const inputClasses =
    'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50';

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
      {/* Honeypot — hidden from real users */}
      <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      {fields.map((field) => (
        <div key={field.id}>
          <label htmlFor={field.id} className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}
            {field.is_required && <span className="ml-0.5 text-red-500">*</span>}
          </label>

          {field.field_type === 'textarea' ? (
            <textarea
              id={field.id}
              placeholder={field.label}
              rows={3}
              className={inputClasses}
              disabled={isSubmitting}
              {...register(field.id)}
            />
          ) : field.field_type === 'select' ? (
            <select
              id={field.id}
              className={inputClasses}
              disabled={isSubmitting}
              {...register(field.id)}
            >
              <option value="">Seleccionar...</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (() => {
            const isContactField = field.field_type === 'email' || field.field_type === 'phone';
            const registration = register(field.id);
            return (
              <input
                id={field.id}
                type={getInputType(field.field_type)}
                inputMode={getInputMode(field.field_type)}
                placeholder={field.label}
                autoComplete={
                  field.field_type === 'email' ? 'email'
                  : field.field_type === 'phone' ? 'tel'
                  : undefined
                }
                className={inputClasses}
                disabled={isSubmitting}
                {...registration}
                onBlur={(e) => {
                  registration.onBlur(e);
                  if (isContactField && onContactBlur) {
                    onContactBlur(field.field_type, e.target.value);
                  }
                }}
              />
            );
          })()}

          {errors[field.id] && (
            <p className="mt-1 text-xs text-red-500">
              {errors[field.id]?.message as string}
            </p>
          )}
        </div>
      ))}

      {/* Photo capture for photo_drop */}
      {needsPhoto && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Foto <span className="ml-0.5 text-red-500">*</span>
          </label>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 transition-colors hover:border-blue-400 hover:bg-blue-50/50">
            <Camera className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-500">
              {photoFile ? photoFile.name : 'Toca para agregar una foto'}
            </span>
            <input
              type="file"
              accept="image/*"
              capture={getCaptureAttr(photoSource)}
              className="hidden"
              onChange={handlePhotoChange}
              disabled={isSubmitting}
            />
          </label>
          {photoError && (
            <p className="mt-1 text-xs text-red-500">{photoError}</p>
          )}
        </div>
      )}

      {/* Privacy & marketing checkboxes */}
      <div className="space-y-3 border-t border-gray-200 pt-4">
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={isSubmitting}
            {...register('privacy_accepted')}
          />
          <span className="text-sm leading-tight text-gray-600">
            Acepto el{' '}
            {privacyNoticeUrl ? (
              <a
                href={privacyNoticeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 underline"
              >
                aviso de privacidad
              </a>
            ) : (
              'aviso de privacidad'
            )}{' '}
            <span className="text-red-500">*</span>
          </span>
        </label>
        {errors.privacy_accepted && (
          <p className="text-xs text-red-500">
            {errors.privacy_accepted.message as string}
          </p>
        )}

        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={isSubmitting}
            {...register('marketing_opt_in')}
          />
          <span className="text-sm leading-tight text-gray-600">
            Acepto recibir comunicaciones de marketing
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Registrando...' : 'Registrarse'}
      </button>
    </form>
  );
}
