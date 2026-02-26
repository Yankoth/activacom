import { z } from 'zod';

export const stepBasicInfoSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100, 'Maximo 100 caracteres'),
  description: z.string().max(500, 'Maximo 500 caracteres').optional().or(z.literal('')),
  type: z.enum(['raffle', 'photo_drop']),
  qr_mode: z.enum(['fixed', 'rotating']),
});

export const stepPrivacySchema = z.object({
  privacy_notice_url: z
    .string()
    .min(1, 'La URL del aviso de privacidad es obligatoria')
    .url('Debe ser una URL valida'),
});

export const stepOptionsSchema = z.object({
  photo_source: z.enum(['camera', 'gallery', 'both']).optional(),
  geofencing_enabled: z.boolean().optional(),
  geofencing_lat: z.coerce.number().min(-90).max(90).optional(),
  geofencing_lng: z.coerce.number().min(-180).max(180).optional(),
  geofencing_radius: z.coerce.number().min(50).max(50000).optional(),
  display_photo_duration: z.coerce.number().min(3).max(30).optional(),
  max_display_sessions: z.coerce.number().min(1).max(10).optional(),
  starts_at: z.string().optional().or(z.literal('')),
  ends_at: z.string().optional().or(z.literal('')),
});

export const createEventSchema = stepBasicInfoSchema
  .merge(stepPrivacySchema)
  .merge(stepOptionsSchema);

export type CreateEventFormData = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();

export type UpdateEventFormData = z.infer<typeof updateEventSchema>;

export const formFieldSchema = z.object({
  label: z.string().min(1, 'La etiqueta es obligatoria').max(100),
  field_type: z.enum(['text', 'email', 'phone', 'number', 'select', 'textarea']),
  is_required: z.boolean(),
  is_contact_field: z.boolean(),
  contact_type: z.enum(['email', 'phone', 'name']).nullable().optional(),
  options: z.array(z.string()).optional(),
  sort_order: z.number(),
});

export type FormFieldFormData = z.infer<typeof formFieldSchema>;
