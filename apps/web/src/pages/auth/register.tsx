import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Zap } from 'lucide-react';
import type { TenantType } from '@activacom/shared/types';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/slugify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TENANT_TYPE_LABELS: Record<TenantType, string> = {
  restaurant: 'Restaurante',
  event_organizer: 'Organizador de eventos',
  band: 'Grupo musical',
};

const registerSchema = z
  .object({
    businessName: z.string().min(2, 'Minimo 2 caracteres'),
    type: z.enum(['restaurant', 'event_organizer', 'band'], {
      error: 'Selecciona un tipo',
    }),
    email: z.email('Email invalido'),
    password: z.string().min(6, 'Minimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { session, isInitialized } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  if (isInitialized && session) {
    return <Navigate to="/dashboard" replace />;
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-primary text-primary-foreground mx-auto mb-4 flex size-12 items-center justify-center rounded-xl">
              <Zap className="size-6" />
            </div>
            <CardTitle className="text-2xl">Revisa tu correo</CardTitle>
            <CardDescription>
              Te enviamos un enlace de confirmacion. Revisa tu bandeja de entrada para activar tu
              cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center text-sm">
              ¿Ya confirmaste?{' '}
              <Link to="/auth/login" className="text-primary hover:underline">
                Iniciar sesion
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    try {
      const slug = slugify(data.businessName);

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            business_name: data.businessName,
            business_slug: slug,
            business_type: data.type,
          },
        },
      });

      if (signUpError) throw signUpError;

      const user = authData.user;
      if (!user) throw new Error('No se pudo crear el usuario');

      // If email confirmation is required, the session won't exist yet.
      // Business info is stored in user_metadata and will be used to
      // create the tenant on first login (see auth-store.ts).
      if (!authData.session) {
        setEmailSent(true);
        return;
      }

      const { error: rpcError } = await supabase.rpc('create_tenant_with_admin', {
        p_user_id: user.id,
        p_tenant_name: data.businessName,
        p_tenant_slug: slug,
        p_tenant_type: data.type,
      });

      if (rpcError) throw rpcError;

      // Auth state change listener in the store will handle loading user data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la cuenta';
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-4 flex size-12 items-center justify-center rounded-xl">
            <Zap className="size-6" />
          </div>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Registra tu negocio en ActivaCom</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre del negocio</Label>
              <Input
                id="businessName"
                placeholder="Mi Restaurante"
                {...register('businessName')}
              />
              {errors.businessName && (
                <p className="text-destructive text-sm">{errors.businessName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de negocio</Label>
              <Select onValueChange={(val) => setValue('type', val as TenantType)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(TENANT_TYPE_LABELS) as [TenantType, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-destructive text-sm">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-destructive text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-destructive text-sm">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Crear cuenta
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link to="/auth/login" className="text-primary hover:underline">
                Iniciar sesion
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
