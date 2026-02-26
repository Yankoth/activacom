import { useState } from 'react';
import { Trophy, Shuffle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEventRegistrations } from '@/hooks/use-registrations';
import { useSelectWinner, useEventWinner } from '@/hooks/use-winners';
import { useAuthStore } from '@/stores/auth-store';

interface WinnerDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WinnerDialog({ eventId, open, onOpenChange }: WinnerDialogProps) {
  const [mode, setMode] = useState<'random' | 'specific'>('random');
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string>('');
  const { data: registrations } = useEventRegistrations(eventId);
  const { data: existingWinner } = useEventWinner(eventId);
  const selectWinner = useSelectWinner();
  const user = useAuthStore((s) => s.user);

  function handleSelect() {
    if (!user) return;
    selectWinner.mutate(
      {
        eventId,
        registrationId: mode === 'specific' ? selectedRegistrationId : undefined,
        selectedBy: user.id,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  if (existingWinner) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="size-5" />
              Ganador seleccionado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <p className="text-lg font-semibold">
              {existingWinner.contact.first_name} {existingWinner.contact.last_name}
            </p>
            {existingWinner.contact.email && (
              <p className="text-muted-foreground text-sm">{existingWinner.contact.email}</p>
            )}
            {existingWinner.contact.phone && (
              <p className="text-muted-foreground text-sm">{existingWinner.contact.phone}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="size-5" />
            Seleccionar ganador
          </DialogTitle>
          <DialogDescription>
            Elige un ganador al azar o selecciona uno de la lista de participantes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Button
              variant={mode === 'random' ? 'default' : 'outline'}
              onClick={() => setMode('random')}
              className="flex-1"
            >
              <Shuffle className="mr-2 size-4" />
              Al azar
            </Button>
            <Button
              variant={mode === 'specific' ? 'default' : 'outline'}
              onClick={() => setMode('specific')}
              className="flex-1"
            >
              <UserCheck className="mr-2 size-4" />
              Elegir
            </Button>
          </div>

          {mode === 'specific' && (
            <Select value={selectedRegistrationId} onValueChange={setSelectedRegistrationId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar participante..." />
              </SelectTrigger>
              <SelectContent>
                {registrations?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.contact.first_name} {r.contact.last_name}
                    {r.contact.email ? ` (${r.contact.email})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSelect}
            disabled={
              selectWinner.isPending ||
              (mode === 'specific' && !selectedRegistrationId) ||
              !registrations?.length
            }
          >
            {selectWinner.isPending ? 'Seleccionando...' : 'Confirmar ganador'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
