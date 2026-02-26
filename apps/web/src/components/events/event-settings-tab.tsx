import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateEventSchema, type UpdateEventFormData } from '@/lib/validations/event';
import { useUpdateEvent } from '@/hooks/use-events';
import { FormBuilder } from '@/components/forms';
import type { EventWithFormFields } from '@/lib/api/events';

interface EventSettingsTabProps {
  event: EventWithFormFields;
}

export function EventSettingsTab({ event }: EventSettingsTabProps) {
  const updateMutation = useUpdateEvent();
  const isEditable = event.status === 'draft' || event.status === 'active';

  const form = useForm<UpdateEventFormData>({
    resolver: zodResolver(updateEventSchema),
    defaultValues: {
      name: event.name,
      description: event.description ?? '',
      type: event.type,
      qr_mode: event.qr_mode,
      photo_source: event.photo_source ?? undefined,
      privacy_notice_url: event.privacy_notice_url ?? '',
      geofencing_enabled: event.geofencing_enabled,
      geofencing_lat: event.geofencing_lat ?? undefined,
      geofencing_lng: event.geofencing_lng ?? undefined,
      geofencing_radius: event.geofencing_radius ?? undefined,
      display_photo_duration: event.display_photo_duration,
      max_display_sessions: event.max_display_sessions,
      starts_at: event.starts_at ?? '',
      ends_at: event.ends_at ?? '',
    },
  });

  function onSubmit(data: UpdateEventFormData) {
    updateMutation.mutate({
      id: event.id,
      input: {
        ...data,
        description: data.description || null,
        privacy_notice_url: data.privacy_notice_url || null,
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
        geofencing_lat: data.geofencing_enabled ? data.geofencing_lat : null,
        geofencing_lng: data.geofencing_enabled ? data.geofencing_lng : null,
        geofencing_radius: data.geofencing_enabled ? data.geofencing_radius : null,
      },
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuracion del evento</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditable} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripcion</FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={!isEditable} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={event.status !== 'draft'}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="raffle">Rifa</SelectItem>
                          <SelectItem value="photo_drop">PhotoDrop</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qr_mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modo QR</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={event.status !== 'draft'}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fixed">Fijo</SelectItem>
                          <SelectItem value="rotating">Rotativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="privacy_notice_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL del aviso de privacidad</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://..."
                        {...field}
                        disabled={!isEditable}
                      />
                    </FormControl>
                    <FormDescription>
                      Obligatorio para activar el evento (LFPDPPP)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="geofencing_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditable}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Habilitar geofencing</FormLabel>
                  </FormItem>
                )}
              />

              {form.watch('geofencing_enabled') && (
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="geofencing_lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitud</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} disabled={!isEditable} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="geofencing_lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitud</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} disabled={!isEditable} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="geofencing_radius"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Radio (m)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} disabled={!isEditable} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="display_photo_duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duracion de foto en display (seg)</FormLabel>
                      <FormControl>
                        <Input type="number" min={3} max={30} {...field} disabled={!isEditable} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max_display_sessions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max sesiones de display</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={10} {...field} disabled={!isEditable} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="starts_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de inicio</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} disabled={!isEditable} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ends_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de fin</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} disabled={!isEditable} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isEditable && (
                <Button type="submit" disabled={updateMutation.isPending}>
                  <Save className="mr-2 size-4" />
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campos del formulario</CardTitle>
        </CardHeader>
        <CardContent>
          <FormBuilder eventId={event.id} disabled={!isEditable} />
        </CardContent>
      </Card>
    </div>
  );
}
