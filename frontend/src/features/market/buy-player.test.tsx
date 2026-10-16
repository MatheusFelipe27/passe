import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Club } from '@/api/clubs';
import type { Purchase } from '@/api/market';
import type { Player } from '@/api/players';
import {
  apiPath,
  mockApiWith,
  sentChanges,
  type MockResponse,
} from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { PlayersPage } from '@/features/players/players-page';

const DAY = 24 * 60 * 60 * 1000;

const FREE: Player = {
  id: 3,
  name: 'Eduardo Paiva',
  position: 'MEI',
  agility: 68,
  age: 26,
  condition: 'APTO',
  base_value: 46,
  market_value: 46,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
  overall: 76,
  club_id: null,
};

const OWNED: Player = { ...FREE, id: 4, name: 'Danilo Freitas', club_id: 5 };

const TUBAROES: Club = {
  id: 6,
  name: 'Tubarões EC',
  acronym: 'TUB',
  cash: 300,
  squad_value: 0,
  net_worth: 300,
};

const GAMA: Club = {
  id: 5,
  name: 'Gama SC',
  acronym: 'GAM',
  cash: 181.84,
  squad_value: 0,
  net_worth: 181.84,
};

const PURCHASE: Purchase = {
  id: 10,
  club_id: 6,
  player_id: 3,
  player_name: 'Eduardo Paiva',
  type: 'COMPRA',
  value: 46,
  fee: 2.3,
  penalty: 0,
  profit: null,
  cash_change: -48.3,
  created_at: '2026-11-12T15:00:00-03:00',
  contract: {
    purchase_value: 46,
    loyalty_until: '2027-11-12T15:00:00-03:00',
    status: 'ATIVO',
  },
  club_cash: 251.7,
};

// Data no horário de Brasília, como o campo de data da tela devolve (AAAA-MM-DD).
function brasiliaDate(offsetMs: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(Date.now() + offsetMs));
}

function renderBuy(buy?: MockResponse | (() => MockResponse)) {
  const fetchMock = mockApiWith((url, init) => {
    const path = apiPath(url);
    if (init.method === 'POST' && path === '/players/3/buy') {
      return typeof buy === 'function' ? buy() : buy;
    }
    if (path === '/players') {
      return {
        body: {
          data: [FREE, OWNED],
          meta: { page: 1, limit: 10, total_items: 2, total_pages: 1 },
        },
      };
    }
    if (path === '/players/3') {
      return { body: FREE };
    }
    if (path === '/clubs') {
      return { body: [GAMA, TUBAROES] };
    }
    return undefined;
  });
  const rendered = renderRoutes(
    [
      { path: '/jogadores', element: <PlayersPage /> },
      { path: '/clubes/:id', element: <ClubProbe /> },
    ],
    '/jogadores',
  );
  return { fetchMock, ...rendered };
}

function ClubProbe() {
  const { id } = useParams();
  return <p>Página do clube {id}</p>;
}

async function openBuy() {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Comprar Eduardo Paiva' }),
  );
  return screen.findByRole('dialog', { name: 'Comprar jogador' });
}

async function fill(
  dialog: HTMLElement,
  { club = '6', date = brasiliaDate(30 * DAY), time = '15:00' } = {},
) {
  await waitFor(() =>
    expect(within(dialog).getAllByRole('option').length).toBeGreaterThan(1),
  );
  await userEvent.selectOptions(
    within(dialog).getByLabelText('Clube comprador'),
    club,
  );
  const dateInput = within(dialog).getByLabelText('Fim da fidelidade');
  await userEvent.clear(dateInput);
  if (date) {
    await userEvent.type(dateInput, date);
  }
  const timeInput = within(dialog).getByLabelText('Hora do fim da fidelidade');
  await userEvent.clear(timeInput);
  if (time) {
    await userEvent.type(timeInput, time);
  }
  return { date, time };
}

function confirmButton(dialog: HTMLElement) {
  return within(dialog).getByRole('button', {
    name: /Confirmar compra|Tentar de novo|Comprando/,
  });
}

describe('compra pela tela de jogadores', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('oferece Comprar só para o jogador livre, na linha e no menu', async () => {
    renderBuy();

    expect(
      await screen.findByRole('button', { name: 'Comprar Eduardo Paiva' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Comprar Danilo Freitas' }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Ações de Danilo Freitas' }),
    );
    expect(
      screen.queryByRole('menuitem', { name: 'Comprar' }),
    ).not.toBeInTheDocument();
  });

  it('abre a compra pelo menu e pelo painel de detalhes', async () => {
    renderBuy();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ações de Eduardo Paiva' }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Comprar' }));
    expect(
      await screen.findByRole('dialog', { name: 'Comprar jogador' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await userEvent.click(
      screen.getByRole('button', { name: 'Ações de Eduardo Paiva' }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Ver detalhes' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Comprar' }),
    );
    expect(
      await screen.findByRole('dialog', { name: 'Comprar jogador' }),
    ).toBeInTheDocument();
  });

  it('mostra o jogador, os clubes com o caixa e o limite do clube escolhido', async () => {
    renderBuy();
    const dialog = await openBuy();

    expect(within(dialog).getByText('Eduardo Paiva')).toBeInTheDocument();
    expect(within(dialog).getByText('46,00')).toBeInTheDocument();
    expect(
      await within(dialog).findByRole('option', {
        name: 'Tubarões EC (TUB) · caixa 300,00',
      }),
    ).toBeInTheDocument();

    await userEvent.selectOptions(
      within(dialog).getByLabelText('Clube comprador'),
      '5',
    );

    expect(
      within(dialog).getByText(
        'Caixa atual: 181,84. O custo total (valor + taxa) pode ir até 50% do caixa.',
      ),
    ).toBeInTheDocument();
  });

  it('valida antes de enviar e não manda nada com os campos vazios', async () => {
    const { fetchMock } = renderBuy();
    const dialog = await openBuy();

    await userEvent.click(confirmButton(dialog));

    expect(
      await within(dialog).findByText('Escolha o clube comprador.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Informe a data.')).toBeInTheDocument();
    expect(sentChanges(fetchMock)).toEqual([]);
  });

  it.each([
    ['ontem', -DAY],
    ['daqui a 1.096 dias', 1096 * DAY],
  ])('recusa na tela o fim da fidelidade %s, sem enviar', async (_, offset) => {
    const { fetchMock } = renderBuy();
    const dialog = await openBuy();
    await fill(dialog, { date: brasiliaDate(offset) });

    await userEvent.click(confirmButton(dialog));

    expect(
      await within(dialog).findByText(
        'Escolha um fim depois de agora e até 1.095 dias.',
      ),
    ).toBeInTheDocument();
    expect(sentChanges(fetchMock)).toEqual([]);
  });

  it('envia o clube e a data com o fuso e mostra o resultado devolvido pela API', async () => {
    const { fetchMock, router } = renderBuy({ body: PURCHASE });
    const dialog = await openBuy();
    const { date } = await fill(dialog);

    await userEvent.click(confirmButton(dialog));

    const result = await screen.findByRole('dialog', {
      name: 'Compra concluída',
    });
    expect(sentChanges(fetchMock)).toEqual([
      {
        method: 'POST',
        path: '/players/3/buy',
        body: { club_id: 6, loyalty_until: `${date}T15:00-03:00` },
      },
    ]);
    expect(result).toHaveTextContent('Eduardo Paiva agora é do Tubarões EC.');
    const rows = within(result)
      .getAllByRole('term')
      .map((term) => [term.textContent, term.nextElementSibling?.textContent]);
    expect(rows).toEqual([
      ['ValorValor de mercado no momento da compra', '46,00'],
      ['Taxa5% do valor, porque passa de 30,00', '2,30'],
      ['Custo totalValor + taxa', '48,30'],
      ['Fim da fidelidade', '12/11/2027, 15:00'],
      ['Contrato', 'ATIVO'],
      ['Novo caixa do Tubarões EC', '251,70'],
    ]);

    await userEvent.click(
      within(result).getByRole('button', { name: /Ver clube/ }),
    );
    expect(await screen.findByText('Página do clube 6')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/clubes/6');
  });

  it('explica a compra sem taxa quando a API devolve taxa zero', async () => {
    renderBuy({
      body: {
        ...PURCHASE,
        value: 30,
        fee: 0,
        cash_change: -30,
        club_cash: 270,
      },
    });
    const dialog = await openBuy();
    await fill(dialog);

    await userEvent.click(confirmButton(dialog));

    const result = await screen.findByRole('dialog', {
      name: 'Compra concluída',
    });
    expect(result).toHaveTextContent('Sem taxa: o valor não passa de 30,00');
    expect(result).toHaveTextContent('Custo totalValor + taxa30,00');
  });

  it('rebusca as listas depois da compra', async () => {
    const { fetchMock } = renderBuy({ body: PURCHASE });
    const listCalls = () =>
      fetchMock.mock.calls.filter(([input]) =>
        ['/players', '/clubs'].includes(apiPath(new URL(String(input)))),
      ).length;
    const dialog = await openBuy();
    await fill(dialog);
    const before = listCalls();

    await userEvent.click(confirmButton(dialog));

    await screen.findByRole('dialog', { name: 'Compra concluída' });
    await waitFor(() => expect(listCalls()).toBeGreaterThan(before));
  });

  it.each([
    'O custo da compra (105,00) passa de 50% do caixa do Gama SC (181,84).',
    'O elenco do Delta FC já tem 12 jogadores, o máximo permitido.',
    'O Águias FC já vendeu este jogador e não pode comprá-lo de novo.',
  ])('mostra a recusa da API na janela: %s', async (message) => {
    renderBuy({ status: 409, body: { message } });
    const dialog = await openBuy();
    await fill(dialog);

    await userEvent.click(confirmButton(dialog));

    const banner = await within(dialog).findByText('Compra recusada');
    expect(banner.closest('[data-slot="alert"]')).toHaveTextContent(message);
    expect(
      screen.queryByRole('dialog', { name: 'Compra concluída' }),
    ).not.toBeInTheDocument();
    expect(confirmButton(dialog)).toHaveTextContent('Confirmar compra');
  });

  it('põe no campo da data a recusa da API sobre o fim da fidelidade', async () => {
    renderBuy({
      status: 400,
      body: {
        message:
          'loyalty_until: deve ser depois do momento da compra e até 1095 dias depois dele',
      },
    });
    const dialog = await openBuy();
    await fill(dialog);

    await userEvent.click(confirmButton(dialog));

    const message =
      'Deve ser depois do momento da compra e até 1095 dias depois dele.';
    await waitFor(() =>
      expect(within(dialog).getAllByText(message)).toHaveLength(2),
    );
    expect(within(dialog).getByLabelText('Fim da fidelidade')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('avisa a falha de conexão e tenta de novo', async () => {
    let attempts = 0;
    const { fetchMock } = renderBuy(() => {
      attempts += 1;
      return attempts === 1 ? { networkError: true } : { body: PURCHASE };
    });
    const dialog = await openBuy();
    await fill(dialog);

    await userEvent.click(confirmButton(dialog));

    const banner = await within(dialog).findByText('Sem conexão');
    expect(banner.closest('[data-slot="alert"]')).toHaveTextContent(
      'A compra não foi confirmada. Verifique a conexão e tente de novo.',
    );
    expect(confirmButton(dialog)).toHaveTextContent('Tentar de novo');

    await userEvent.click(confirmButton(dialog));

    expect(
      await screen.findByRole('dialog', { name: 'Compra concluída' }),
    ).toBeInTheDocument();
    expect(sentChanges(fetchMock)).toHaveLength(2);
  });

  it('trava os botões enquanto envia e manda um só pedido no clique duplo', async () => {
    const { fetchMock } = renderBuy({ body: PURCHASE, delayMs: 300 });
    const dialog = await openBuy();
    await fill(dialog);

    await userEvent.dblClick(confirmButton(dialog));

    expect(
      await within(dialog).findByText(
        'Enviando a compra. Os botões ficam desabilitados até a resposta.',
      ),
    ).toBeInTheDocument();
    expect(confirmButton(dialog)).toHaveTextContent('Comprando…');
    expect(confirmButton(dialog)).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    ).toBeDisabled();
    await screen.findByRole('dialog', { name: 'Compra concluída' });
    expect(sentChanges(fetchMock)).toHaveLength(1);
  });

  it('liga o clube do jogador comprado à página do clube', async () => {
    renderBuy();

    const link = await screen.findByRole('link', { name: 'Gama SC' });

    expect(link).toHaveAttribute('href', '/clubes/5');
  });
});
