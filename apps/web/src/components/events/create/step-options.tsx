import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { CreateEventFormData } from '@/lib/validations/event';

export function StepOptions() {
  const { control, watch } = useFormContext<CreateEventFormData>();
  const geofencingEnabled = watch('geofencing_enabled');

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="geofencing_enabled"
        render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="!mt-0">Habilitar geofencing</FormLabel>
          </FormItem>
        )}
      />

      {geofencingEnabled && (
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={control}
            name="geofencing_lat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitud</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="geofencing_lng"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitud</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="geofencing_radius"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Radio (m)</FormLabel>
                <FormControl>
                  <Input type="number" min={50} max={50000} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <FormField
        control={control}
        name="max_display_sessions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max sesiones de display</FormLabel>
            <FormControl>
              <Input type="number" min={1} max={10} placeholder="3" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="starts_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de inicio (opcional)</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="ends_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de fin (opcional)</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
