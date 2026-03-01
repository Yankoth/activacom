import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, UserMinus, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useModerators,
  useInviteModerator,
  useDeactivateModerator,
  useReactivateModerator,
} from '@/hooks/use-moderators';

const inviteSchema = z.object({
  email: z.string().email('Ingresa un email valido'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export function ModeratorsSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: moderators, isLoading } = useModerators();
  const invite = useInviteModerator();
  const deactivate = useDeactivateModerator();
  const reactivate = useReactivateModerator();

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values: InviteFormData) => {
    invite.mutate(values.email, {
      onSuccess: () => {
        form.reset();
        setDialogOpen(false);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Moderadores</CardTitle>
            <CardDescription>
              Invita y gestiona moderadores que pueden aprobar o rechazar fotos.
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 size-4" />
                Invitar moderador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>Invitar moderador</DialogTitle>
                  <DialogDescription>
                    Se enviara un email de invitacion para que el moderador cree su cuenta.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="moderador@ejemplo.com"
                    {...form.register('email')}
                    className="mt-1.5"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={invite.isPending}>
                    {invite.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Enviar invitacion
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !moderators || moderators.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No hay moderadores. Invita a alguien para que te ayude a moderar fotos.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {moderators.map((mod) => (
                <TableRow key={mod.id}>
                  <TableCell className="font-medium">{mod.email}</TableCell>
                  <TableCell>
                    {mod.is_active ? (
                      <Badge variant="default">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(mod.created_at).toLocaleDateString('es-MX')}
                  </TableCell>
                  <TableCell className="text-right">
                    {mod.is_active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deactivate.mutate(mod.id)}
                        disabled={deactivate.isPending}
                      >
                        <UserMinus className="mr-1 size-4" />
                        Desactivar
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => reactivate.mutate(mod.id)}
                        disabled={reactivate.isPending}
                      >
                        <UserCheck className="mr-1 size-4" />
                        Reactivar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
