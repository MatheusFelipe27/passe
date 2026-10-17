import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClubDetail, RosterPlayer } from '@/api/clubs';
import type { Sale } from '@/api/market';
import {
  apiPath,
  mockApiWith,
  sentChanges,
  type MockResponse,
} from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { ClubPage } from '@/features/clubs/club-page';

const DEFENDER: RosterPlayer = {
  id: 3,
  name: 'Felipe Moura',
  position: 'ZAG',
  agility: 60,
  age: 27,
  condition: 'APTO',
  base_value: 52,
  market_value: 52,
  pace: 70,
  shooting: 40,
  passing: 70,
  dribbling: 50,
  defending: 85,
  physical: 80,
  potential: 85,
  overall: 77,
  club_id: 1,
  contract: {
    purchase_value: 44.2,
    loyalty_until: '2027-04-04T15:45:00-03:00',
    remaining_days: 144,
    penalty_rate: 10,
  },
};

const AGUIAS: ClubDetail = {
  id: 1,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 51.58,
  squad_value: 52,
  net_worth: 103.58,
  players: [DEFENDER],
};

const SALE: Sale = {
  id: 11,
  club_id: 1,
  player_id: 3,
  player_name: 'Felipe Moura',
  type: 'VENDA',
  value: 52,
  fee: 0.78,
  penalty: 5.2,
  profit: 7.8,
  cash_change: 46.02,
  created_at: '2026-11-12T15:00:00-03:00',
  purchase_value: 44.2,
  remaining_days: 144,
  penalty_rate: 10,
  contract_status: 'RESCINDIDO',
  club_cash: 97.6,
};

const FULFILLED: Sale = {
  ...SALE,
  value: 24,
  fee: 0,
  penalty: 0,
  profit: -4.8,
  cash_change: 24,
  purchase_value: 28.8,
  remaining_days: 0,
  penalty_rate: 0,
  contract_status: 'ENCERRADO',
  club_cash: 75.58,
};

function renderClub(sell?: MockResponse | (() => MockResponse)) {
  const fetchMock = mockApiWith((url, init) => {
    const path = apiPath(url);
    if (init.method === 'POST' && path === '/players/3/sell') {
      return typeof sell === 'function' ? sell() : sell;
    }
    if (path === '/clubs/1') {
      return { body: AGUIAS };
    }
    return undefined;
  });
  const rendered = renderRoutes(
    [
      { path: '/clubes/:id', element: <ClubPage /> },
      { path: '/jogadores', element: <p>Lista de jogadores</p> },
    ],
    '/clubes/1',
  );
  return { fetchMock, ...rendered };
}

async function openSell() {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Vender Felipe Moura' }),
  );
  return screen.findByRole('dialog', { name: 'Vender Felipe Moura?' });
}

function confirmButton(dialog: HTMLElement) {
  return within(dialog).getByRole('button', {
    name: /Confirmar venda|Tentar de novo|Vendendo/,
  });
}

function rowsOf(dialog: HTMLElement) {
  return within(dialog)
    .getAllByRole('term')
    .map((term) => [term.textContent, term.nextElementSibling?.textContent]);
}

describe('venda pela página do clube', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('leva o botão Comprar jogadores para a lista de livres', async () => {
    const { router } = renderClub();

    await userEvent.click(
      await screen.findByRole('link', { name: 'Comprar jogadores' }),
    );

    expect(await screen.findByText('Lista de jogadores')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?free=true');
  });

  it('confirma antes com o contrato como a API mostrou', async () => {
    const { fetchMock } = renderClub();
    const dialog = await openSell();

    expect(dialog).toHaveTextContent(
      'O jogador sai do elenco do Águias FC e volta a ficar livre.',
    );
    expect(rowsOf(dialog)).toEqual([
      ['Valor de compra', '44,20'],
      ['Fim da fidelidade', '04/04/2027, 15:45'],
      ['Dias restantes', '144'],
      ['% de multa se vender agora', '10%'],
    ]);
    expect(sentChanges(fetchMock)).toEqual([]);
  });

  it('cancela sem enviar nada', async () => {
    const { fetchMock } = renderClub();
    const dialog = await openSell();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Vender Felipe Moura?' }),
      ).not.toBeInTheDocument(),
    );
    expect(sentChanges(fetchMock)).toEqual([]);
  });

  it('vende sem corpo e mostra o resultado com multa e lucro', async () => {
    const { fetchMock } = renderClub({ body: SALE });
    const dialog = await openSell();

    await userEvent.click(confirmButton(dialog));

    const result = await screen.findByRole('dialog', {
      name: 'Venda concluída',
    });
    expect(sentChanges(fetchMock)).toEqual([
      { method: 'POST', path: '/players/3/sell', body: undefined },
    ]);
    expect(result).toHaveTextContent('Felipe Moura voltou a ficar livre.');
    expect(result).not.toHaveTextContent('não houve multa');
    expect(rowsOf(result)).toEqual([
      ['Valor de compra', '44,20'],
      ['Valor de vendaValor de mercado no momento da venda', '52,00'],
      ['Dias restantes', '144'],
      ['Multa10% do valor de venda, com teto de 10,00', '5,20'],
      ['Lucro', '+7,80'],
      ['Comissão10% do lucro até 10,00 + 20% do que passar', '0,78'],
      ['Crédito no caixaValor de venda − multa − comissão', '+46,02'],
      ['Contrato', 'RESCINDIDO'],
      ['Novo caixa do Águias FC', '97,60'],
    ]);
    expect(within(result).getByText('+7,80')).toHaveClass('text-success');
  });

  it('abre a aba Histórico pelo botão Ver histórico', async () => {
    const { router } = renderClub({ body: SALE });
    const dialog = await openSell();
    await userEvent.click(confirmButton(dialog));
    const result = await screen.findByRole('dialog', {
      name: 'Venda concluída',
    });

    await userEvent.click(
      within(result).getByRole('button', { name: 'Ver histórico' }),
    );

    expect(router.state.location.search).toBe('?tab=historico');
    expect(screen.getByRole('tab', { name: /Histórico/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Venda concluída' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('mostra a venda com a fidelidade cumprida, sem multa e com prejuízo', async () => {
    renderClub({ body: FULFILLED });
    const dialog = await openSell();

    await userEvent.click(confirmButton(dialog));

    const result = await screen.findByRole('dialog', {
      name: 'Venda concluída',
    });
    expect(result).toHaveTextContent(
      'Felipe Moura voltou a ficar livre. A fidelidade já tinha terminado, então não houve multa.',
    );
    expect(rowsOf(result)).toEqual([
      ['Valor de compra', '28,80'],
      ['Valor de vendaValor de mercado no momento da venda', '24,00'],
      ['Dias restantes', '0'],
      ['MultaFidelidade cumprida: sem multa', '0,00'],
      ['Lucro', '−4,80'],
      ['ComissãoSem lucro: sem comissão', '0,00'],
      ['Crédito no caixaValor de venda − multa − comissão', '+24,00'],
      ['Contrato', 'ENCERRADO'],
      ['Novo caixa do Águias FC', '75,58'],
    ]);
    expect(within(result).getByText('−4,80')).toHaveClass('text-destructive');
  });

  it('mostra o lucro zero sem sinal, sem cor e sem comissão', async () => {
    renderClub({ body: { ...SALE, profit: 0, fee: 0, value: 44.2 } });
    const dialog = await openSell();

    await userEvent.click(confirmButton(dialog));

    const result = await screen.findByRole('dialog', {
      name: 'Venda concluída',
    });
    const profit = within(result)
      .getByText('Lucro')
      .closest('div')!.nextElementSibling!;
    expect(profit).toHaveTextContent('0,00');
    expect(profit).not.toHaveClass('text-success');
    expect(profit).not.toHaveClass('text-destructive');
    expect(result).toHaveTextContent('Sem lucro: sem comissão');
  });

  it('rebusca o clube depois da venda', async () => {
    const { fetchMock } = renderClub({ body: SALE });
    const clubCalls = () =>
      fetchMock.mock.calls.filter(
        ([input]) => apiPath(new URL(String(input))) === '/clubs/1',
      ).length;
    const dialog = await openSell();
    const before = clubCalls();

    await userEvent.click(confirmButton(dialog));

    await screen.findByRole('dialog', { name: 'Venda concluída' });
    await waitFor(() => expect(clubCalls()).toBeGreaterThan(before));
  });

  it('mostra a recusa da API na janela', async () => {
    renderClub({
      status: 409,
      body: { message: 'Jogador livre não pode ser vendido.' },
    });
    const dialog = await openSell();

    await userEvent.click(confirmButton(dialog));

    const banner = await within(dialog).findByText('A venda foi recusada');
    expect(banner.closest('[data-slot="alert"]')).toHaveTextContent(
      'Jogador livre não pode ser vendido.',
    );
    expect(confirmButton(dialog)).toHaveTextContent('Confirmar venda');
  });

  it('avisa a falha de conexão e tenta de novo', async () => {
    let attempts = 0;
    const { fetchMock } = renderClub(() => {
      attempts += 1;
      return attempts === 1 ? { networkError: true } : { body: SALE };
    });
    const dialog = await openSell();

    await userEvent.click(confirmButton(dialog));

    expect(await within(dialog).findByText('Sem conexão')).toBeInTheDocument();
    expect(confirmButton(dialog)).toHaveTextContent('Tentar de novo');

    await userEvent.click(confirmButton(dialog));

    expect(
      await screen.findByRole('dialog', { name: 'Venda concluída' }),
    ).toBeInTheDocument();
    expect(sentChanges(fetchMock)).toHaveLength(2);
  });

  it('trava os botões enquanto envia e manda um só pedido no clique duplo', async () => {
    const { fetchMock } = renderClub({ body: SALE, delayMs: 300 });
    const dialog = await openSell();

    await userEvent.dblClick(confirmButton(dialog));

    expect(
      await within(dialog).findByText(
        'Enviando a venda. Os botões ficam desabilitados até a resposta.',
      ),
    ).toBeInTheDocument();
    expect(confirmButton(dialog)).toHaveTextContent('Vendendo…');
    expect(confirmButton(dialog)).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    ).toBeDisabled();
    await screen.findByRole('dialog', { name: 'Venda concluída' });
    expect(sentChanges(fetchMock)).toHaveLength(1);
  });
});
