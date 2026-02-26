import type { EventStatus } from '@activacom/shared/types';
import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG: Record<EventStatus, { label: string; variant: 'secondary' | 'default' | 'outline' | 'ghost' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  active: { label: 'Activo', variant: 'default' },
  closed: { label: 'Cerrado', variant: 'outline' },
  archived: { label: 'Archivado', variant: 'ghost' },
};

interface EventStatusBadgeProps {
  status: EventStatus;
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant={config.variant}
      className={status === 'active' ? 'bg-green-600 text-white hover:bg-green-600/90' : undefined}
    >
      {config.label}
    </Badge>
  );
}
