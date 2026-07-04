import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export type Column<T> = {
  key: string;
  header: ReactNode;
  /** Conteúdo da célula. */
  cell: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  /** Alinhar à direita (valores/ações). */
  align?: 'left' | 'right' | 'center';
  width?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  skeletonRows?: number;
  empty?: ReactNode;
  /** Largura mínima para permitir scroll horizontal em telas estreitas. */
  minWidth?: number;
  className?: string;
};

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

/**
 * Tabela de dados padrão do sistema — densa, com cabeçalho fixo em maiúsculas,
 * hover por linha e scroll horizontal. Toda listagem do app usa este componente.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  loading = false,
  skeletonRows = 8,
  empty,
  minWidth = 900,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground',
                    alignClass[col.align ?? 'left'],
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, r) => (
                <tr key={r} className="border-b border-border/60">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2.5">
                      <Skeleton className="h-4 w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-14 text-center">
                  {empty ?? <span className="text-sm text-muted-foreground">Nenhum registro encontrado.</span>}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-border/60 transition-colors last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-muted/30',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-3 py-2.5 align-middle', alignClass[col.align ?? 'left'], col.className)}
                    >
                      {col.cell(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
