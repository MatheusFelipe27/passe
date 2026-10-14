import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PaginationBar } from './pagination-bar';

const LABEL = { singular: 'jogador', plural: 'jogadores' };

function renderBar(page: number, totalItems: number, limit = 10) {
  const onPageChange = vi.fn();
  render(
    <PaginationBar
      page={page}
      limit={limit}
      totalItems={totalItems}
      totalPages={Math.ceil(totalItems / limit)}
      itemLabel={LABEL}
      onPageChange={onPageChange}
    />,
  );
  return onPageChange;
}

function pageNumbers(): string[] {
  return screen
    .getAllByRole('button', { name: /^Página/ })
    .map((button) => button.textContent ?? '');
}

describe('PaginationBar', () => {
  it.each([
    [1, 23, 'Mostrando 1–10 de 23 jogadores'],
    [3, 23, 'Mostrando 21–23 de 23 jogadores'],
    [1, 1, 'Mostrando 1–1 de 1 jogador'],
    [1, 10, 'Mostrando 1–10 de 10 jogadores'],
  ])('na página %i de %i itens mostra "%s"', (page, total, text) => {
    renderBar(page, total);

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('avisa quando a página passou da última', () => {
    renderBar(4, 23);

    expect(
      screen.getByText('Nenhum jogador nesta página, de 23 jogadores'),
    ).toBeInTheDocument();
  });

  it.each([
    [1, 23, ['1', '2', '3']],
    [1, 100, ['1', '2', '3', '4', '5']],
    [6, 100, ['4', '5', '6', '7', '8']],
    [10, 100, ['6', '7', '8', '9', '10']],
  ])('na página %i de %i itens mostra as páginas %j', (page, total, pages) => {
    renderBar(page, total);

    expect(pageNumbers()).toEqual(pages);
  });

  it('marca a página atual', () => {
    renderBar(2, 23);

    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it.each([
    [1, true, false],
    [2, false, false],
    [3, false, true],
  ])(
    'na página %i: Anterior desabilitado = %s e Próxima desabilitado = %s',
    (page, previousDisabled, nextDisabled) => {
      renderBar(page, 23);

      expect(
        screen
          .getByRole('button', { name: /Anterior/ })
          .hasAttribute('disabled'),
      ).toBe(previousDisabled);
      expect(
        screen
          .getByRole('button', { name: /Próxima/ })
          .hasAttribute('disabled'),
      ).toBe(nextDisabled);
    },
  );

  it('pede a página clicada, a anterior e a próxima', async () => {
    const onPageChange = renderBar(2, 23);

    await userEvent.click(screen.getByRole('button', { name: 'Página 3' }));
    await userEvent.click(screen.getByRole('button', { name: /Anterior/ }));
    await userEvent.click(screen.getByRole('button', { name: /Próxima/ }));

    expect(onPageChange.mock.calls).toEqual([[3], [1], [3]]);
  });
});
