import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClubDetail, RosterPlayer } from '@/api/clubs';
import { AppLayout, type RouteHandle } from '@/components/layout/app-layout';
import {
  apiPath,
  mockApiWith,
  requestedUrls,
  type MockResponse,
} from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { ClubCrumb } from './club-crumb';
import { ClubPage } from './club-page';

function rosterPlayer(
  id: number,
  name: string,
  position: RosterPlayer['position'],
  contract: RosterPlayer['contract'],
): RosterPlayer {
  return {
    id,
    name,
    position,
    agility: 60,
    age: 25,
    condition: 'APTO',
    base_value: 30,
    market_value: 32,
    pace: 60,
    shooting: 60,
    passing: 60,
    dribbling: 60,
    defending: 60,
    physical: 60,
    potential: 70,
    overall: 71,
    club_id: 1,
    contract,
  };
}

const GOALKEEPER = rosterPlayer(8, 'Bruno Tavares', 'GOL', {
  purchase_value: 32,
  loyalty_until: '2028-11-03T11:20:00-03:00',
  remaining_days: 1089,
  penalty_rate: 20,
});
const DEFENDER = rosterPlayer(3, 'Felipe Moura', 'ZAG', {
  purchase_value: 44.2,
  loyalty_until: '2027-04-04T15:45:00-03:00',
  remaining_days: 144,
  penalty_rate: 10,
});
const MIDFIELDER = rosterPlayer(5, 'Lucas Ferraz', 'MEI', {
  purchase_value: 28.8,
  loyalty_until: '2026-11-07T09:00:00-03:00',
  remaining_days: 0,
  penalty_rate: 0,
});
const WITHOUT_CONTRACT = rosterPlayer(9, 'João Silva', 'ATA', null);

const AGUIAS: ClubDetail = {
  id: 1,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 51.58,
  squad_value: 222.68,
  net_worth: 274.26,
  players: [GOALKEEPER, DEFENDER, MIDFIELDER, WITHOUT_CONTRACT],
};

const EMPTY_HISTORY = {
  data: [],
  summary: {
    total_spent: 0,
    total_received: 0,
    total_fees: 0,
    total_penalties: 0,
    total_profit: 0,
  },
};

function renderClub(response: MockResponse, path = '/clubes/1') {
  const fetchMock = mockApiWith((url) => {
    const path = apiPath(url);
    if (path.endsWith('/transactions')) {
      return { body: EMPTY_HISTORY };
    }
    return path.startsWith('/clubs/') ? response : undefined;
  });
  const rendered = renderRoutes(
    [
      { path: '/clubes/:id', element: <ClubPage /> },
      { path: '/clubes', element: <p>Lista de clubes</p> },
      { path: '/jogadores', element: <p>Lista de jogadores</p> },
    ],
    path,
  );
  return { fetchMock, ...rendered };
}

function rosterRows() {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1);
}

function cellsOf(row: HTMLElement) {
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);
}

describe('ClubPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra o cabeçalho e os cartões com os valores devolvidos pela API', async () => {
    renderClub({ body: AGUIAS });

    expect(
      await screen.findByRole('heading', { name: 'Águias FC' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Sigla AGU')).toBeInTheDocument();
    expect(screen.getByText('4 de 12 jogadores')).toBeInTheDocument();
    expect(screen.getByText('51,58')).toBeInTheDocument();
    expect(screen.getByText('222,68')).toBeInTheDocument();
    expect(screen.getByText('274,26')).toBeInTheDocument();
    expect(screen.getByText('4 de 12')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Elenco/ })).toHaveTextContent(
      'Elenco4',
    );
  });

  it('mostra o elenco na ordem da API, com o contrato de cada jogador', async () => {
    renderClub({ body: AGUIAS });
    await screen.findByRole('table');

    expect(rosterRows().map((row) => cellsOf(row)[0])).toEqual([
      'BTBruno Tavares',
      'FMFelipe Moura',
      'LFLucas Ferraz',
      'JSJoão Silva',
    ]);
    expect(cellsOf(rosterRows()[0])).toEqual([
      'BTBruno Tavares',
      'GOL',
      '71',
      'Apto',
      '32,00',
      '32,00',
      '03/11/202811:20',
      '1.089',
      '20%',
      'Vender',
    ]);
    expect(cellsOf(rosterRows()[1]).slice(5)).toEqual([
      '44,20',
      '04/04/202715:45',
      '144',
      '10%',
      'Vender',
    ]);
    expect(cellsOf(rosterRows()[2]).slice(5)).toEqual([
      '28,80',
      '07/11/202609:00',
      '0',
      '0%',
      'Vender',
    ]);
  });

  it('mostra um traço nas colunas de contrato de quem não tem contrato', async () => {
    renderClub({ body: AGUIAS });
    await screen.findByRole('table');

    expect(cellsOf(rosterRows()[3]).slice(5)).toEqual([
      '–',
      '–',
      '–',
      '–',
      'Vender',
    ]);
  });

  it('avisa quando os valores foram calculados e o teto da multa', async () => {
    renderClub({ body: AGUIAS });

    expect(
      await screen.findByText(/A multa tem teto de 10,00\./),
    ).toBeInTheDocument();
  });

  it('mostra o elenco vazio com o caminho para os jogadores livres', async () => {
    const { router } = renderClub({ body: { ...AGUIAS, players: [] } });

    expect(
      await screen.findByText('Nenhum jogador no elenco'),
    ).toBeInTheDocument();
    expect(screen.getByText('0 de 12 jogadores')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText(/teto de/)).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('link', { name: 'Ver jogadores livres' }),
    );
    expect(await screen.findByText('Lista de jogadores')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?free=true');
  });

  it('mostra o carregamento enquanto a API não responde', async () => {
    renderClub({ body: AGUIAS, delayMs: 1000 });

    expect(await screen.findByText('Carregando…')).toBeInTheDocument();
  });

  it.each([
    ['inexistente', '/clubes/999', '/clubs/999'],
    ['com id malformado', '/clubes/abc', '/clubs/abc'],
  ])('avisa que o clube %s não foi encontrado', async (_, path, requested) => {
    const { fetchMock } = renderClub(
      { status: 404, body: { message: 'Clube não encontrado.' } },
      path,
    );

    expect(await screen.findByText('Clube não encontrado')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Clube não encontrado. O endereço pode estar errado ou o clube não existe.',
      ),
    ).toBeInTheDocument();
    expect(apiPath(requestedUrls(fetchMock)[0])).toBe(requested);

    await userEvent.click(
      screen.getByRole('link', { name: 'Voltar para clubes' }),
    );
    expect(await screen.findByText('Lista de clubes')).toBeInTheDocument();
  });

  it('mostra o erro com o message da API e tenta de novo', async () => {
    let calls = 0;
    mockApiWith((url) => {
      if (apiPath(url).endsWith('/transactions')) {
        return { body: EMPTY_HISTORY };
      }
      calls += 1;
      return calls === 1
        ? { status: 500, body: { message: 'Erro interno do servidor.' } }
        : { body: AGUIAS };
    });
    renderRoutes([{ path: '/clubes/:id', element: <ClubPage /> }], '/clubes/1');

    expect(
      await screen.findByText('Não foi possível carregar o elenco'),
    ).toBeInTheDocument();
    expect(screen.getByText('Erro interno do servidor.')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar de novo' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Águias FC' }),
    ).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it('põe o nome do clube no fim da trilha de navegação', async () => {
    mockApiWith((url) => {
      const path = apiPath(url);
      if (path === '/clubs/1') {
        return { body: AGUIAS };
      }
      if (path === '/clubs' || path === '/matches') {
        return { body: [] };
      }
      return {
        body: {
          data: [],
          meta: { page: 1, limit: 1, total_items: 0, total_pages: 0 },
        },
      };
    });
    const handle: RouteHandle = {
      breadcrumb: ['Mercado', 'Clubes'],
      current: ClubCrumb,
    };
    renderRoutes(
      [
        {
          element: <AppLayout />,
          children: [{ path: '/clubes/:id', element: <ClubPage />, handle }],
        },
      ],
      '/clubes/1',
    );

    const trail = screen.getByRole('navigation', {
      name: 'Trilha de navegação',
    });
    expect(await within(trail).findByText('Águias FC')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(trail).getByText('Clubes')).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('clube inexistente: a trilha mostra o id da URL', async () => {
    mockApiWith((url) => {
      const path = apiPath(url);
      if (path === '/clubs/99') {
        return { status: 404, body: { message: 'Clube não encontrado.' } };
      }
      if (path === '/clubs' || path === '/matches') {
        return { body: [] };
      }
      return {
        body: {
          data: [],
          meta: { page: 1, limit: 1, total_items: 0, total_pages: 0 },
        },
      };
    });
    const handle: RouteHandle = {
      breadcrumb: ['Mercado', 'Clubes'],
      current: ClubCrumb,
    };
    renderRoutes(
      [
        {
          element: <AppLayout />,
          children: [{ path: '/clubes/:id', element: <ClubPage />, handle }],
        },
      ],
      '/clubes/99',
    );

    const trail = screen.getByRole('navigation', {
      name: 'Trilha de navegação',
    });
    expect(await within(trail).findByText('Clube 99')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      await screen.findByRole('link', { name: 'Voltar para clubes' }),
    ).toBeInTheDocument();
  });
});
