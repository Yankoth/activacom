import { useFormContext } from 'react-hook-form';
import { ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { CreateEventFormData } from '@/lib/validations/event';

export function StepPrivacy() {
  const { control } = useFormContext<CreateEventFormData>();

  return (
    <div className="space-y-4">
      <Alert>
        <ShieldCheck className="size-4" />
        <AlertDescription>
          La Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares (LFPDPPP)
          requiere que informes a los participantes sobre el uso de sus datos. El evento no podra
          activarse sin un aviso de privacidad.
        </AlertDescription>
      </Alert>

      <FormField
        control={control}
        name="privacy_notice_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL del aviso de privacidad</FormLabel>
            <FormControl>
              <Input
                type="url"
                placeholder="https://tu-sitio.com/aviso-de-privacidad"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Enlace al documento completo de aviso de privacidad. Los participantes lo veran antes
              de registrarse.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
