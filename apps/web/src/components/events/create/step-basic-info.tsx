import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
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
import type { CreateEventFormData } from '@/lib/validations/event';

export function StepBasicInfo() {
  const { control } = useFormContext<CreateEventFormData>();

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del evento</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Rifa de Navidad 2026" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripcion (opcional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe brevemente el evento..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de evento</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="raffle">Rifa</SelectItem>
                <SelectItem value="photo_drop">PhotoDrop</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Rifa: solo formulario. PhotoDrop: formulario + foto.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="qr_mode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Modo de QR</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar modo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="fixed">Fijo (restaurante)</SelectItem>
                <SelectItem value="rotating">Rotativo (evento puntual)</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Fijo: URL permanente por tenant. Rotativo: URL unica por evento.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
