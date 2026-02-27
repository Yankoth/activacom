import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContactsPaginationProps {
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function ContactsPagination({
  page,
  totalCount,
  pageSize,
  onPageChange,
}: ContactsPaginationProps) {
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalCount);
  const hasNext = (page + 1) * pageSize < totalCount;
  const hasPrev = page > 0;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <p className="text-muted-foreground text-sm">
        Mostrando {from}–{to} de {totalCount} contactos
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
        >
          <ChevronLeft className="mr-1 size-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
        >
          Siguiente
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}
