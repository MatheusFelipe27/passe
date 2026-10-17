import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Shirt } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { OptionFilter } from './option-filter';

const OPTIONS = [
  { value: 'GOL', label: 'GOL' },
  { value: 'ATA', label: 'ATA' },
];

function renderFilter(
  value: string | undefined,
  disabled = false,
  showAllLabel = false,
) {
  const onChange = vi.fn();
  render(
    <OptionFilter
      icon={Shirt}
      label="Posição"
      allLabel="Todas as posições"
      options={OPTIONS}
      value={value}
      onChange={onChange}
      disabled={disabled}
      showAllLabel={showAllLabel}
    />,
  );
  return onChange;
}

describe('OptionFilter', () => {
  it('fica cinza e mostra só o rótulo quando está vazio', () => {
    renderFilter(undefined);

    const button = screen.getByRole('button', { name: 'Posição' });
    expect(button).toHaveClass('text-muted-foreground');
  });

  it('escurece e mostra a escolha quando tem valor', () => {
    renderFilter('ATA');

    const button = screen.getByRole('button', { name: 'Posição: ATA' });
    expect(button).not.toHaveClass('text-muted-foreground');
  });

  it('mostra "Rótulo: todas" sem escolha quando pedido, com o texto escuro', () => {
    renderFilter(undefined, false, true);

    const button = screen.getByRole('button', {
      name: 'Posição: todas as posições',
    });
    expect(button).not.toHaveClass('text-muted-foreground');
  });

  it('mostra a escolha mesmo quando pede o rótulo de todos', () => {
    renderFilter('GOL', false, true);

    expect(
      screen.getByRole('button', { name: 'Posição: GOL' }),
    ).toBeInTheDocument();
  });

  it('envia a opção escolhida', async () => {
    const onChange = renderFilter(undefined);

    await userEvent.click(screen.getByRole('button', { name: 'Posição' }));
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'GOL' }),
    );

    expect(onChange).toHaveBeenCalledWith('GOL');
  });

  it('volta para todos pela primeira opção', async () => {
    const onChange = renderFilter('ATA');

    await userEvent.click(screen.getByRole('button', { name: 'Posição: ATA' }));
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Todas as posições' }),
    );

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('não abre quando está desabilitado', () => {
    renderFilter(undefined, true);

    expect(screen.getByRole('button', { name: 'Posição' })).toBeDisabled();
  });
});
