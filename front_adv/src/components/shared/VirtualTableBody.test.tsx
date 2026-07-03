import { createRef } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VirtualTableBody } from './VirtualTableBody';

function renderTable(count: number, threshold = 80) {
  const items = Array.from({ length: count }, (_, i) => ({ id: `row-${i}` }));
  const scrollRef = createRef<HTMLDivElement>();
  const utils = render(
    <div ref={scrollRef} style={{ height: 400, overflow: 'auto' }}>
      <table>
        <VirtualTableBody
          items={items}
          scrollRef={scrollRef}
          colSpan={2}
          threshold={threshold}
          rowHeight={40}
          renderRow={(item) => (
            <tr key={item.id} data-testid="data-row">
              <td>{item.id}</td>
              <td>x</td>
            </tr>
          )}
        />
      </table>
    </div>,
  );
  return utils;
}

describe('VirtualTableBody', () => {
  it('renderiza todas as linhas abaixo do threshold', () => {
    const { getAllByTestId } = renderTable(10);
    expect(getAllByTestId('data-row')).toHaveLength(10);
  });

  it('virtualiza acima do threshold (não monta as 1000 linhas de uma vez)', () => {
    // jsdom não calcula layout, então o virtualizador monta apenas a janela
    // visível (0 no ambiente de teste, uma fração em runtime real). O
    // contrato garantido: NUNCA renderiza a lista inteira.
    const { queryAllByTestId } = renderTable(1000, 80);
    expect(queryAllByTestId('data-row').length).toBeLessThan(1000);
  });

  it('respeita o threshold customizado', () => {
    // 50 itens com threshold 100 => não virtualiza => renderiza todos.
    const { getAllByTestId } = renderTable(50, 100);
    expect(getAllByTestId('data-row')).toHaveLength(50);
  });
});
