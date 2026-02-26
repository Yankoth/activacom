import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { CreateFormFieldInput } from '@activacom/shared/types';

interface FormRendererProps {
  fields: CreateFormFieldInput[];
  privacyNoticeUrl?: string;
}

function buildFormSchema(fields: CreateFormFieldInput[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  fields.forEach((f, i) => {
    const key = `field_${i}`;
    if (f.field_type === 'email') {
      shape[key] = f.is_required
        ? z.string().min(1, 'Este campo es obligatorio').email('Email invalido')
        : z.string().email('Email invalido').optional().or(z.literal(''));
    } else if (f.field_type === 'phone') {
      shape[key] = f.is_required
        ? z.string().min(1, 'Este campo es obligatorio').regex(/^\+?[\d\s()-]{7,15}$/, 'Telefono invalido')
        : z.string().regex(/^\+?[\d\s()-]{7,15}$/, 'Telefono invalido').optional().or(z.literal(''));
    } else if (f.field_type === 'number') {
      shape[key] = f.is_required
        ? z.coerce.number({ invalid_type_error: 'Debe ser un numero' })
        : z.union([z.coerce.number(), z.literal('')]).optional();
    } else {
      shape[key] = f.is_required
        ? z.string().min(1, 'Este campo es obligatorio')
        : z.string().optional().or(z.literal(''));
    }
  });

  shape['privacy_accepted'] = z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar el aviso de privacidad' }),
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

export function FormRenderer({ fields, privacyNoticeUrl }: FormRendererProps) {
  const visibleFields = fields.filter((f) => f.label.trim());

  const schema = useMemo(() => buildFormSchema(visibleFields), [visibleFields]);

  const defaultValues = useMemo(() => {
    const values: Record<string, string | boolean> = {};
    visibleFields.forEach((_, i) => {
      values[`field_${i}`] = '';
    });
    values['privacy_accepted'] = false;
    values['marketing_opt_in'] = false;
    return values;
  }, [visibleFields]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  if (visibleFields.length === 0) {
    return (
      <p className="text-muted-foreground text-center text-sm py-8">
        No hay campos para previsualizar
      </p>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-zinc-950">
      <Form {...form}>
        <div className="space-y-4">
          {visibleFields.map((field, i) => (
            <FormField
              key={i}
              control={form.control}
              name={`field_${i}`}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>
                    {field.label}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                  <FormControl>
                    {field.field_type === 'textarea' ? (
                      <Textarea
                        placeholder={field.label}
                        {...formField}
                        value={formField.value as string}
                      />
                    ) : field.field_type === 'select' ? (
                      <Select
                        onValueChange={formField.onChange}
                        value={formField.value as string}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={getInputType(field.field_type)}
                        placeholder={field.label}
                        {...formField}
                        value={formField.value as string}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <div className="border-t pt-4 space-y-3">
            <FormField
              control={form.control}
              name="privacy_accepted"
              render={({ field: formField }) => (
                <FormItem>
                  <div className="flex items-start gap-2">
                    <FormControl>
                      <Checkbox
                        checked={formField.value as boolean}
                        onCheckedChange={formField.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal leading-tight !mt-0">
                      Acepto el{' '}
                      {privacyNoticeUrl ? (
                        <a
                          href={privacyNoticeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          aviso de privacidad
                        </a>
                      ) : (
                        'aviso de privacidad'
                      )}{' '}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="marketing_opt_in"
              render={({ field: formField }) => (
                <FormItem>
                  <div className="flex items-start gap-2">
                    <FormControl>
                      <Checkbox
                        checked={formField.value as boolean}
                        onCheckedChange={formField.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal leading-tight !mt-0">
                      Acepto recibir comunicaciones de marketing
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <Button type="button" className="w-full" disabled>
            Registrarse (solo vista previa)
          </Button>
        </div>
      </Form>
    </div>
  );
}
