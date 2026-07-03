import { type ReactNode, type RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

type VirtualTableBodyProps<T> = {
  items: T[];
  /** Container com overflow-y-auto que serve de viewport da rolagem. */
  scrollRef: RefObject<HTMLElement>;
  /** Altura fixa de cada linha em px (as tabelas-alvo têm linhas uniformes). */
  rowHeight?: number;
  /** Número de colunas — usado nos espaçadores (colSpan). */
  colSpan: number;
  /** A partir de quantos itens a virtualização é ativada. */
  threshold?: number;
  /** Deve retornar um `<tr>` completo (com key própria). */
  renderRow: (item: T, index: number) => ReactNode;
};

/**
 * `<tbody>` que só monta as linhas visíveis quando a lista é grande,
 * usando linhas-espaçador acima/abaixo para preservar a rolagem. Abaixo do
 * `threshold`, renderiza tudo (sem overhead). Assume linhas de altura fixa,
 * então funciona com qualquer componente de linha existente sem refatorá-lo.
 */
export function VirtualTableBody<T>({
  items,
  scrollRef,
  rowHeight = 52,
  colSpan,
  threshold = 80,
  renderRow,
}: VirtualTableBodyProps<T>) {
  const shouldVirtualize = items.length > threshold;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
    enabled: shouldVirtualize,
  });

  if (!shouldVirtualize) {
    return <tbody>{items.map((item, index) => renderRow(item, index))}</tbody>;
  }

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

  return (
    <tbody>
      {paddingTop > 0 && (
        <tr aria-hidden>
          <td colSpan={colSpan} style={{ height: paddingTop, padding: 0, border: 0 }} />
        </tr>
      )}
      {virtualItems.map((virtualRow) => renderRow(items[virtualRow.index], virtualRow.index))}
      {paddingBottom > 0 && (
        <tr aria-hidden>
          <td colSpan={colSpan} style={{ height: paddingBottom, padding: 0, border: 0 }} />
        </tr>
      )}
    </tbody>
  );
}
