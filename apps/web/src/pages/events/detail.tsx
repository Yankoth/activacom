import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  EventHeader,
  EventSummaryTab,
  EventParticipantsTab,
  EventSettingsTab,
  WinnerDialog,
} from '@/components/events';
import { useEvent } from '@/hooks/use-events';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id!);
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Evento no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EventHeader
        event={event}
        onSelectWinner={
          event.status === 'active' || event.status === 'closed'
            ? () => setWinnerDialogOpen(true)
            : undefined
        }
      />

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="participants">Participantes</TabsTrigger>
          <TabsTrigger value="settings">Configuracion</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="mt-4">
          <EventSummaryTab event={event} />
        </TabsContent>
        <TabsContent value="participants" className="mt-4">
          <EventParticipantsTab eventId={event.id} eventName={event.name} />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <EventSettingsTab event={event} />
        </TabsContent>
      </Tabs>

      <WinnerDialog
        eventId={event.id}
        open={winnerDialogOpen}
        onOpenChange={setWinnerDialogOpen}
      />
    </div>
  );
}
