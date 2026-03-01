import { useFormContext } from 'react-hook-form';
import { Camera, Image, ImagePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { CreateEventFormData } from '@/lib/validations/event';

const PHOTO_SOURCE_OPTIONS = [
  { value: 'camera' as const, label: 'Camara', icon: Camera, description: 'Solo camara del dispositivo' },
  { value: 'gallery' as const, label: 'Galeria', icon: Image, description: 'Solo galeria de fotos' },
  { value: 'both' as const, label: 'Ambas', icon: ImagePlus, description: 'Camara y galeria' },
];

export function StepPhotoConfig() {
  const { control } = useFormContext<CreateEventFormData>();

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="photo_source"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fuente de fotos</FormLabel>
            <FormControl>
              <div className="grid grid-cols-3 gap-3">
                {PHOTO_SOURCE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = field.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`size-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-muted-foreground text-center text-xs">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="require_photo"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Requerir foto</FormLabel>
              <FormDescription>
                Requerir foto para completar el registro
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="display_photo_duration"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Duracion de foto en display (seg)</FormLabel>
            <FormControl>
              <Input type="number" min={3} max={30} placeholder="5" {...field} />
            </FormControl>
            <FormDescription>
              Tiempo en segundos que cada foto se muestra en la pantalla de display (3-30)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
