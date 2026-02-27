import { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Shuffle, UserCheck, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEventRegistrations } from '@/hooks/use-registrations';
import { useSelectWinner, useEventWinners } from '@/hooks/use-winners';
import type { SelectWinnerResponse } from '@activacom/shared/types';
import type { RegistrationWithContact } from '@/lib/api/registrations';

interface WinnerDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogView = 'choose_mode' | 'revealing' | 'revealed' | 'manual_select';

export function WinnerDialog({ eventId, open, onOpenChange }: WinnerDialogProps) {
  const [view, setView] = useState<DialogView>('choose_mode');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [revealedWinner, setRevealedWinner] = useState<SelectWinnerResponse | null>(null);

  const { data: registrations } = useEventRegistrations(eventId);
  const { data: winners } = useEventWinners(eventId);
  const selectWinnerMutation = useSelectWinner();

  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedRef = useRef<SelectWinnerResponse | null>(null);
  const phaseRef = useRef<'fast' | 'slowing' | 'done'>('fast');
  const slowCountRef = useRef(0);

  const winnerContactIds = new Set(winners?.map((w) => w.contact_id) ?? []);

  // Cleanup cycle on unmount or dialog close
  useEffect(() => {
    if (!open) {
      if (cycleRef.current) clearTimeout(cycleRef.current);
      setView('choose_mode');
      setSearchQuery('');
      setDisplayName('');
      setRevealedWinner(null);
      resolvedRef.current = null;
      phaseRef.current = 'fast';
      slowCountRef.current = 0;
    }
  }, [open]);

  function getContactName(reg: RegistrationWithContact): string {
    const parts = [reg.contact.first_name, reg.contact.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : (reg.contact.email ?? reg.contact.phone ?? 'Participante');
  }

  const cycleName = useCallback(() => {
    if (!registrations || registrations.length === 0) return;

    const randomIndex = Math.floor(Math.random() * registrations.length);
    setDisplayName(getContactName(registrations[randomIndex]));

    if (phaseRef.current === 'done') {
      // Land on real winner name
      if (resolvedRef.current) {
        const w = resolvedRef.current.winner;
        const name = [w.contact.first_name, w.contact.last_name].filter(Boolean).join(' ') || 'Ganador';
        setDisplayName(name);
        setRevealedWinner(resolvedRef.current);
        setView('revealed');
      }
      return;
    }

    if (phaseRef.current === 'slowing') {
      slowCountRef.current++;
      const delays = [150, 200, 300, 400, 600];
      const delay = delays[Math.min(slowCountRef.current, delays.length - 1)];
      if (slowCountRef.current >= delays.length) {
        phaseRef.current = 'done';
        cycleRef.current = setTimeout(cycleName, delay);
      } else {
        cycleRef.current = setTimeout(cycleName, delay);
      }
      return;
    }

    // Fast phase
    if (resolvedRef.current) {
      // Mutation resolved — start slowing
      phaseRef.current = 'slowing';
      slowCountRef.current = 0;
      cycleRef.current = setTimeout(cycleName, 120);
    } else {
      cycleRef.current = setTimeout(cycleName, 80);
    }
  }, [registrations]);

  function handleRandom() {
    setView('revealing');
    resolvedRef.current = null;
    phaseRef.current = 'fast';
    slowCountRef.current = 0;

    // Start cycling
    cycleName();

    // Fire mutation
    selectWinnerMutation.mutate(
      { event_id: eventId, method: 'random' },
      {
        onSuccess: (data) => {
          resolvedRef.current = data;
        },
        onError: () => {
          if (cycleRef.current) clearTimeout(cycleRef.current);
          setView('choose_mode');
        },
      }
    );
  }

  function handleManualSelect(reg: RegistrationWithContact) {
    selectWinnerMutation.mutate(
      { event_id: eventId, method: 'manual', registration_id: reg.id },
      {
        onSuccess: (data) => {
          setRevealedWinner(data);
          setView('revealed');
        },
      }
    );
  }

  function handleSelectAnother() {
    setView('choose_mode');
    setRevealedWinner(null);
    setSearchQuery('');
    resolvedRef.current = null;
    phaseRef.current = 'fast';
    slowCountRef.current = 0;
  }

  const filteredRegistrations = registrations?.filter((reg) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = getContactName(reg).toLowerCase();
    const email = (reg.contact.email ?? '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Choose mode */}
        {view === 'choose_mode' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="size-5" />
                Seleccionar ganador
              </DialogTitle>
              <DialogDescription>
                Elige un ganador al azar o selecciona uno de la lista de participantes.
              </DialogDescription>
            </DialogHeader>

            {winners && winners.length > 0 && (
              <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
                Ya hay <span className="font-semibold">{winners.length}</span> ganador{winners.length > 1 ? 'es' : ''} seleccionado{winners.length > 1 ? 's' : ''}.
              </div>
            )}

            <div className="flex gap-2 py-4">
              <Button
                onClick={handleRandom}
                className="flex-1"
                disabled={!registrations?.length || selectWinnerMutation.isPending}
              >
                <Shuffle className="mr-2 size-4" />
                Al azar
              </Button>
              <Button
                variant="outline"
                onClick={() => setView('manual_select')}
                className="flex-1"
                disabled={!registrations?.length}
              >
                <UserCheck className="mr-2 size-4" />
                Elegir
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Revealing animation */}
        {view === 'revealing' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="size-5 animate-bounce" />
                Seleccionando ganador...
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center py-12">
              <div className="bg-primary/10 rounded-xl px-8 py-6 text-center">
                <p className="text-primary text-2xl font-bold transition-all">
                  {displayName || '...'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Revealed */}
        {view === 'revealed' && revealedWinner && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="text-yellow-500 size-5" />
                Ganador #{revealedWinner.winner_number}
              </DialogTitle>
            </DialogHeader>
            <div className="animate-in fade-in zoom-in-95 py-6 text-center duration-300">
              <div className="bg-primary/5 mx-auto max-w-xs rounded-xl border p-6">
                <p className="text-2xl font-bold">
                  {[revealedWinner.winner.contact.first_name, revealedWinner.winner.contact.last_name]
                    .filter(Boolean)
                    .join(' ') || 'Ganador'}
                </p>
                {revealedWinner.winner.contact.email && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {revealedWinner.winner.contact.email}
                  </p>
                )}
                {revealedWinner.winner.contact.phone && (
                  <p className="text-muted-foreground text-sm">
                    {revealedWinner.winner.contact.phone}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button variant="secondary" onClick={handleSelectAnother}>
                Seleccionar otro ganador
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Manual select */}
        {view === 'manual_select' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="size-5" />
                Elegir ganador
              </DialogTitle>
              <DialogDescription>
                Selecciona un participante de la lista.
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-64 overflow-y-auto rounded-md border">
              {filteredRegistrations && filteredRegistrations.length > 0 ? (
                filteredRegistrations.map((reg) => {
                  const isAlreadyWinner = winnerContactIds.has(reg.contact_id);
                  return (
                    <button
                      key={reg.id}
                      disabled={isAlreadyWinner || selectWinnerMutation.isPending}
                      onClick={() => handleManualSelect(reg)}
                      className="hover:bg-muted/50 flex w-full items-center gap-3 border-b px-3 py-2.5 text-left last:border-b-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {getContactName(reg)}
                        </p>
                        {reg.contact.email && (
                          <p className="text-muted-foreground truncate text-xs">
                            {reg.contact.email}
                          </p>
                        )}
                      </div>
                      {isAlreadyWinner && (
                        <Trophy className="text-yellow-500 size-4 shrink-0" />
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                  No se encontraron participantes.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setView('choose_mode')}>
                Volver
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
