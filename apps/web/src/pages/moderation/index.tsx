import { useQuery } from '@tanstack/react-query';
import { ImageOff, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EventModerationTab } from '@/components/events/event-moderation-tab';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';

function useActivePhotoDropEvent() {
  const tenantId = useAuthStore((s) => s.tenant?.id);

  return useQuery({
    queryKey: ['moderator-active-event', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, type, status')
        .eq('tenant_id', tenantId!)
        .eq('status', 'active')
        .eq('type', 'photo_drop')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
    refetchInterval: 30_000,
  });
}

export default function ModeratorPage() {
  const { data: event, isLoading } = useActivePhotoDropEvent();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Moderacion</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ImageOff className="size-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hay eventos activos para moderar</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cuando haya un evento PhotoDrop activo, las fotos pendientes apareceran aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moderacion</h1>
        <p className="text-muted-foreground mt-1">
          Evento: <span className="font-medium text-foreground">{event.name}</span>
        </p>
      </div>
      <EventModerationTab eventId={event.id} />
    </div>
  );
}
