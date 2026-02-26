import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Archive, Trash2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
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
  useActivateEvent,
  useCloseEvent,
  useArchiveEvent,
  useDeleteEvent,
} from '@/hooks/use-events';
import type { EventWithFormFields } from '@/lib/api/events';

interface EventActionsProps {
  event: EventWithFormFields;
  onSelectWinner?: () => void;
}

type ConfirmAction = 'activate' | 'close' | 'archive' | 'delete' | null;

export function EventActions({ event, onSelectWinner }: EventActionsProps) {
  const navigate = useNavigate();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const activateMutation = useActivateEvent();
  const closeMutation = useCloseEvent();
  const archiveMutation = useArchiveEvent();
  const deleteMutation = useDeleteEvent();

  const isPending =
    activateMutation.isPending ||
    closeMutation.isPending ||
    archiveMutation.isPending ||
    deleteMutation.isPending;

  function handleActivate() {
    if (!event.privacy_notice_url) {
      toast.error('No se puede activar', {
        description: 'El evento necesita un aviso de privacidad configurado.',
      });
      return;
    }
    if (event.form_fields.length === 0) {
      toast.error('No se puede activar', {
        description: 'El evento necesita al menos un campo en el formulario.',
      });
      return;
    }
    setConfirmAction('activate');
  }

  async function executeAction() {
    switch (confirmAction) {
      case 'activate':
        await activateMutation.mutateAsync(event.id);
        break;
      case 'close':
        await closeMutation.mutateAsync(event.id);
        break;
      case 'archive':
        await archiveMutation.mutateAsync(event.id);
        break;
      case 'delete':
        await deleteMutation.mutateAsync(event.id);
        navigate('/events');
        break;
    }
    setConfirmAction(null);
  }

  const confirmMessages: Record<string, { title: string; description: string }> = {
    activate: {
      title: 'Activar evento',
      description:
        'El evento sera visible para los participantes y podran registrarse. ¿Deseas continuar?',
    },
    close: {
      title: 'Cerrar evento',
      description:
        'Los participantes ya no podran registrarse. Podras seleccionar un ganador despues de cerrar.',
    },
    archive: {
      title: 'Archivar evento',
      description: 'El evento sera archivado y no aparecera en la lista principal.',
    },
    delete: {
      title: 'Eliminar evento',
      description:
        'Esta accion no se puede deshacer. Se eliminaran todos los datos asociados al evento.',
    },
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {event.status === 'draft' && (
          <>
            <Button onClick={handleActivate} disabled={isPending}>
              <Play className="mr-2 size-4" />
              Activar
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setConfirmAction('delete')}
              disabled={isPending}
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
        {event.status === 'active' && (
          <Button variant="outline" onClick={() => setConfirmAction('close')} disabled={isPending}>
            <Square className="mr-2 size-4" />
            Cerrar
          </Button>
        )}
        {event.status === 'closed' && (
          <>
            {onSelectWinner && (
              <Button onClick={onSelectWinner} disabled={isPending}>
                <Trophy className="mr-2 size-4" />
                Seleccionar ganador
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setConfirmAction('archive')}
              disabled={isPending}
            >
              <Archive className="mr-2 size-4" />
              Archivar
            </Button>
          </>
        )}
      </div>

      <Dialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmAction && confirmMessages[confirmAction]?.title}</DialogTitle>
            <DialogDescription>
              {confirmAction && confirmMessages[confirmAction]?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancelar
            </Button>
            <Button
              variant={confirmAction === 'delete' ? 'destructive' : 'default'}
              onClick={executeAction}
              disabled={isPending}
            >
              {isPending ? 'Procesando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
