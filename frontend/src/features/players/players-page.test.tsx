import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Player } from '@/api/players';
import {
  apiPath,
  mockApiWith,
  requestedUrls,
  type MockResponse,
} from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { PlayersPage } from './players-page';

const PLAYER: Player = {
  id: 3,
  name: 'Ana Lima',
  position: 'ATA',
  agility: 50,
  age: 21,
  condition: 'APTO',
  base_value: 38.76,
  market_value: 42.64,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
  overall: 72,
  club_id: null,
};

interface Scenario {
  players?: Player[];
  total?: number;
  listResponse?: MockResponse;
}

function renderPlayers({
  players = [PLAYER],
  total = players.length,
  listResponse,
}: Scenario = {}) {
  const fetchMock = mockApiWith((url) => {
    if (apiPath(url) !== '/players') {
      return undefined;
    }
    const limit = Number(url.searchParams.get('limit'));
    if (limit === 1) {
      const free = url.searchParams.get('free');
      const count = free === 'false' ? 0 : total;
      return { body: { data: [], meta: meta(1, 1, count) } };
    }
    return (
      listResponse ?? {
        body: {
          data: players,
          meta: meta(Number(url.searchParams.get('page')), limit, total),
        },
      }
    );
  });
  renderRoutes(
    [{ path: '/jogadores', element: <PlayersPage /> }],
    '/jogadores',
  );
  return fetchMock;
}

function meta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total_items: total,
    total_pages: Math.ceil(total / limit),
  };
}

// Pedidos de lista (limit=10) feitos até agora, com os query params enviados.
function listRequests(fetchMock: ReturnType<typeof vi.fn>): URLSearchParams[] {
  return requestedUrls(fetchMock)
    .filter(
      (url) =>
        apiPath(url) === '/players' && url.searchParams.get('limit') === '10',
    )
    .map((url) => url.searchParams);
}

async function expectListRequest(
  fetchMock: ReturnType<typeof vi.fn>,
  expected: Record<string, string>,
) {
  await waitFor(() => {
    const last = Object.fromEntries(listRequests(fetchMock).at(-1) ?? []);
    expect(last).toEqual({ limit: '10', page: '1', sort: 'name', ...expected });
  });
}

describe('PlayersPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra os jogadores devolvidos pela API, com moedas em pt-BR', async () => {
    renderPlayers();

    const row = (await screen.findByText('Ana Lima')).closest('tr');
    expect(row).not.toBeNull();
    const cells = within(row!);
    expect(cells.getByText('Atacante')).toBeInTheDocument();
    expect(cells.getByText('ATA')).toBeInTheDocument();
    expect(cells.getByText('72')).toBeInTheDocument();
    expect(cells.getByText('Apto')).toBeInTheDocument();
    expect(cells.getByText('38,76')).toBeInTheDocument();
    expect(cells.getByText('42,64')).toBeInTheDocument();
    expect(cells.getByText('Livre')).toBeInTheDocument();
  });

  it('pede a primeira página, ordenada por nome, com 10 por página', async () => {
    const fetchMock = renderPlayers();

    await expectListRequest(fetchMock, {});
  });

  it('mostra o total encontrado e as contagens das abas', async () => {
    renderPlayers({ total: 23 });

    expect(
      await screen.findByText('Mostrando 1–10 de 23 jogadores'),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Todos/ })).toHaveTextContent(
      'Todos23',
    );
    expect(screen.getByRole('tab', { name: /Livres/ })).toHaveTextContent(
      'Livres23',
    );
    expect(screen.getByRole('tab', { name: /Em clubes/ })).toHaveTextContent(
      'Em clubes0',
    );
  });

  it('mostra o estado de carregamento', () => {
    renderPlayers();

    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
  });

  it('mostra a lista vazia sem filtros', async () => {
    renderPlayers({ players: [], total: 0 });

    expect(
      await screen.findByText('Nenhum jogador cadastrado'),
    ).toBeInTheDocument();
  });

  it('mostra o message da API no erro e tenta de novo', async () => {
    const fetchMock = renderPlayers({
      listResponse: { status: 500, body: { message: 'Banco fora do ar.' } },
    });

    expect(
      await screen.findByText('Não foi possível carregar os jogadores'),
    ).toBeInTheDocument();
    expect(screen.getByText('Banco fora do ar.')).toBeInTheDocument();
    const before = listRequests(fetchMock).length;

    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar de novo' }),
    );

    await waitFor(() =>
      expect(listRequests(fetchMock).length).toBe(before + 1),
    );
  });

  it('busca pelo nome a partir de 2 letras', async () => {
    const fetchMock = renderPlayers();
    await screen.findByText('Ana Lima');
    const search = screen.getByRole('searchbox', {
      name: 'Buscar jogador pelo nome',
    });

    await userEvent.type(search, 'j');
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(listRequests(fetchMock).some((params) => params.has('search'))).toBe(
      false,
    );

    await userEvent.type(search, 'o');
    await expectListRequest(fetchMock, { search: 'jo' });
    expect(
      screen.getByRole('button', { name: 'Remover filtro Busca: jo' }),
    ).toBeInTheDocument();
  });

  it('filtra pela posição e remove o filtro pelo chip', async () => {
    const fetchMock = renderPlayers();
    await screen.findByText('Ana Lima');

    await userEvent.click(screen.getByRole('button', { name: /Posição/ }));
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'MEI' }),
    );

    await expectListRequest(fetchMock, { position: 'MEI' });
    await userEvent.click(
      screen.getByRole('button', { name: 'Remover filtro Posição: MEI' }),
    );
    await expectListRequest(fetchMock, {});
  });

  it('filtra pela condição', async () => {
    const fetchMock = renderPlayers();
    await screen.findByText('Ana Lima');

    await userEvent.click(screen.getByRole('button', { name: /Condição/ }));
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Mal condicionado' }),
    );

    await expectListRequest(fetchMock, { condition: 'MAL_CONDICIONADO' });
  });

  it.each([
    ['Livres', 'true'],
    ['Em clubes', 'false'],
  ])('a aba %s envia free=%s', async (tab, free) => {
    const fetchMock = renderPlayers();
    await screen.findByText('Ana Lima');

    await userEvent.click(screen.getByRole('tab', { name: new RegExp(tab) }));

    await expectListRequest(fetchMock, { free });
  });

  it('desabilita o filtro por clube na aba Livres', async () => {
    renderPlayers();
    await screen.findByText('Ana Lima');

    await userEvent.click(screen.getByRole('tab', { name: /Livres/ }));

    expect(screen.getByRole('button', { name: /Clube/ })).toBeDisabled();
  });

  it.each([
    ['Maior valor de mercado', 'value_desc'],
    ['Menor valor de mercado', 'value_asc'],
    ['Maior idade', 'age_desc'],
    ['Menor idade', 'age_asc'],
    ['Posição (GOL a ATA)', 'position'],
  ])('ordena por %s', async (option, sort) => {
    const fetchMock = renderPlayers();
    await screen.findByText('Ana Lima');

    await userEvent.click(screen.getByRole('button', { name: /Ordenar/ }));
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: option }),
    );

    await expectListRequest(fetchMock, { sort });
  });

  it('pede a página escolhida', async () => {
    const fetchMock = renderPlayers({ total: 23 });
    await screen.findByText('Ana Lima');

    await userEvent.click(screen.getByRole('button', { name: 'Página 2' }));

    await expectListRequest(fetchMock, { page: '2' });
  });

  it('filtra pela faixa de idade e recusa mínimo maior que o máximo', async () => {
    const fetchMock = renderPlayers();
    await screen.findByText('Ana Lima');

    await userEvent.click(screen.getByRole('button', { name: /Idade/ }));
    await userEvent.type(screen.getByLabelText('Mínimo'), '31');
    await userEvent.type(screen.getByLabelText('Máximo'), '30');
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'O mínimo não pode ser maior que o máximo.',
    );

    await userEvent.clear(screen.getByLabelText('Mínimo'));
    await userEvent.type(screen.getByLabelText('Mínimo'), '18');
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    await expectListRequest(fetchMock, { min_age: '18', max_age: '30' });
    expect(
      screen.getByRole('button', { name: 'Remover filtro Idade: 18 a 30' }),
    ).toBeInTheDocument();
  });

  it('filtra pela faixa de valor de mercado com vírgula decimal', async () => {
    const fetchMock = renderPlayers();
    await screen.findByText('Ana Lima');

    await userEvent.click(
      screen.getByRole('button', { name: /Valor de mercado/ }),
    );
    await userEvent.type(screen.getByLabelText('Mínimo'), '10,5');
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    await expectListRequest(fetchMock, { min_value: '10.5' });
    expect(
      screen.getByRole('button', {
        name: 'Remover filtro Valor de mercado: a partir de 10,50',
      }),
    ).toBeInTheDocument();
  });

  it('limpa todos os filtros de uma vez', async () => {
    const fetchMock = renderPlayers();
    await screen.findByText('Ana Lima');
    await userEvent.click(screen.getByRole('button', { name: /Posição/ }));
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'GOL' }),
    );
    await expectListRequest(fetchMock, { position: 'GOL' });

    await userEvent.click(
      screen.getByRole('button', { name: 'Limpar filtros' }),
    );

    await expectListRequest(fetchMock, {});
  });
});
