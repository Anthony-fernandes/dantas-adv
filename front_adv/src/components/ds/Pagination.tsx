import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Paginação padrão para rodapé de listagem. */
export function Pagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
  itemLabel = 'registros',
}: {
  page: number;
  totalPages: number;
  totalCount?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <p className="text-[12px] text-muted-foreground">
        {typeof totalCount === 'number' ? `${totalCount.toLocaleString('pt-BR')} ${itemLabel} · ` : ''}
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="h-8 gap-1 px-2.5" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1 px-2.5" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
