import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Club } from '@/api/clubs';
import type { MatchSummary, Standing } from '@/api/league';
import { apiPath, mockApiWith, type MockResponse } from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { NewMatchDialogProvider } from './new-match-dialog-provider';
import { StandingsPage } from './standings-page';

function standing(
  position: number,
  clubId: number,
  name: string,
  values: [number, number, number, number, number, number, number, number],
): Standing {
  const [played, wins, draws, losses, goalsFor, goalsAgainst, diff, points] =
    values;
  return {
    position,
    club_id: clubId,
    club_name: name,
    played,
    wins,
    draws,
    losses,
    goals_for: goalsFor,
    goals_against: goalsAgainst,
    goal_difference: diff,
    points,
  };
}

// O exemplo da RN21: 6 clubes e 4 partidas.
const STANDINGS: Standing[] = [
  standing(1, 3, 'Gama SC', [2, 2, 0, 0, 3, 1, 2, 6]),
  standing(2, 4, 'Épsilon EC', [2, 1, 0, 1, 4, 4, 0, 3]),
  standing(3, 2, 'Delta FC', [2, 1, 0, 1, 2, 2, 0, 3]),
  standing(4, 6, 'Mangue FC', [0, 0, 0, 0, 0, 0, 0, 0]),
  standing(5, 5, 'Tubarões EC', [0, 0, 0, 0, 0, 0, 0, 0]),
  standing(6, 1, 'Águias FC', [2, 0, 0, 2, 3, 5, -2, 0]),
];

const CLUBS: Club[] = [
  [1, 'Águias FC', 'AGU'],
  [2, 'Delta FC', 'DEL'],
  [3, 'Gama SC', 'GAM'],
  [4, 'Épsilon EC', 'EPS'],
  [5, 'Tubarões EC', 'TUB'],
  [6, 'Mangue FC', 'MNG'],
].map(([id, name, acronym]) => ({
  id: id as number,
  name: name as string,
  acronym: acronym as string,
  cash: 300,
  squad_value: 0,
  net_worth: 300,
}));

function match(
  id: number,
  playedAt: string,
  home: [number, string, number],
  away: [number, string, number],
): MatchSummary {
  const [homeId, homeName, homeGoals] = home;
  const [awayId, awayName, awayGoals] = away;
  return {
    id,
    played_at: playedAt,
    home: {
      club_id: homeId,
      club_name: homeName,
      formation: '2-1-1',
      goals: homeGoals,
    },
    away: {
      club_id: awayId,
      club_name: awayName,
      formation: '2-1-1',
      goals: awayGoals,
    },
    result:
      homeGoals > awayGoals
        ? 'MANDANTE'
        : homeGoals < awayGoals
          ? 'VISITANTE'
          : 'EMPATE',
  };
}

const MATCHES = [
  match(4, '2026-11-12T20:00:00-03:00', [2, 'Delta FC', 0], [3, 'Gama SC', 1]),
  match(
    3,
    '2026-11-11T20:00:00-03:00',
    [4, 'Épsilon EC', 3],
    [1, 'Águias FC', 2],
  ),
  match(
    2,
    '2026-11-10T20:00:00-03:00',
    [3, 'Gama SC', 2],
    [4, 'Épsilon EC', 1],
  ),
];

interface Scenario {
  standings?: MockResponse | (() => MockResponse);
  matches?: MockResponse;
}

function renderStandings(scenario: Scenario = {}) {
  mockApiWith((url) => {
    const route = apiPath(url);
    if (route === '/standings') {
      const response = scenario.standings ?? { body: STANDINGS };
      return typeof response === 'function' ? response() : response;
    }
    if (route === '/matches') {
      return scenario.matches ?? { body: MATCHES };
    }
    return route === '/clubs' ? { body: CLUBS } : undefined;
  });
  return renderRoutes(
    [
      {
        path: '/classificacao',
        element: (
          <NewMatchDialogProvider>
            <StandingsPage />
          </NewMatchDialogProvider>
        ),
      },
      { path: '/clubes/:id', element: <p>Página do clube</p> },
      { path: '/partidas', element: <p>Lista de partidas</p> },
    ],
    '/classificacao',
  );
}

function tableRows() {
  const table = within(
    screen.getByRole('region', { name: 'Classificação' }),
  ).getByRole('table');
  return within(table).getAllByRole('row').slice(1);
}

function cellsOf(row: HTMLElement) {
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);
}

describe('tela Classificação', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra todas as colunas do exemplo da RN21, com o saldo com sinal', async () => {
    renderStandings();
    await screen.findByText('GAM');

    expect(
      within(screen.getByRole('region', { name: 'Classificação' }))
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['#', 'Clube', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG', 'Pts']);
    expect(tableRows().map(cellsOf)).toEqual([
      ['1', 'GAMGama SC', '2', '2', '0', '0', '3', '1', '+2', '6'],
      ['2', 'EPSÉpsilon EC', '2', '1', '0', '1', '4', '4', '0', '3'],
      ['3', 'DELDelta FC', '2', '1', '0', '1', '2', '2', '0', '3'],
      ['4', 'MNGMangue FC', '0', '0', '0', '0', '0', '0', '0', '0'],
      ['5', 'TUBTubarões EC', '0', '0', '0', '0', '0', '0', '0', '0'],
      ['6', 'AGUÁguias FC', '2', '0', '0', '2', '3', '5', '−2', '0'],
    ]);
  });

  it('mostra a sigla de cada clube, vinda da lista de clubes', async () => {
    renderStandings();
    await screen.findByRole('link', { name: 'Gama SC' });

    expect(await within(tableRows()[0]).findByText('GAM')).toBeInTheDocument();
    expect(within(tableRows()[5]).getByText('AGU')).toBeInTheDocument();
  });

  it('segue a ordem da API, sem reordenar', async () => {
    const shuffled = [STANDINGS[5], STANDINGS[0], STANDINGS[3]];
    renderStandings({ standings: { body: shuffled } });
    await screen.findByText('GAM');

    expect(
      tableRows().map((row) => within(row).getByRole('link').textContent),
    ).toEqual(['Águias FC', 'Gama SC', 'Mangue FC']);
  });

  it('destaca só o líder', async () => {
    renderStandings();
    await screen.findByRole('link', { name: 'Gama SC' });
    const [leader, second] = tableRows();

    const badgeOf = (row: HTMLElement) =>
      within(row).getAllByRole('cell')[0].firstElementChild;
    expect(badgeOf(leader)).toHaveClass('bg-primary');
    expect(badgeOf(second)).not.toHaveClass('bg-primary');
  });

  it('o nome do clube abre a página dele', async () => {
    const { router } = renderStandings();

    await userEvent.click(await screen.findByRole('link', { name: 'Gama SC' }));

    expect(router.state.location.pathname).toBe('/clubes/3');
  });

  it('explica as abreviações e a ordem da tabela', async () => {
    renderStandings();
    await screen.findByRole('link', { name: 'Gama SC' });

    expect(
      screen.getByText(
        'J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols marcados · GC: gols sofridos · SG: saldo de gols · Pts: pontos',
      ),
    ).toBeInTheDocument();
    const order = screen.getByRole('region', { name: 'Ordem da tabela' });
    expect(
      within(order)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      '1Mais pontos',
      '2Maior saldo de gols',
      '3Mais gols marcados',
      '4Nome do clube, de A a Z',
    ]);
  });

  it('mostra as 2 partidas mais recentes, e o link para todas', async () => {
    const { router } = renderStandings();
    const recent = await screen.findByRole('list', {
      name: 'Últimas partidas',
    });

    const items = within(recent).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('12/11/2026, 20:00');
    expect(items[0]).toHaveTextContent('Delta FC0 × 1Gama SC');
    expect(within(items[0]).getByText('Gama SC')).toHaveClass('font-semibold');
    expect(items[1]).toHaveTextContent('Épsilon EC3 × 2Águias FC');

    await userEvent.click(
      screen.getByRole('link', { name: 'Ver todas as partidas' }),
    );

    expect(router.state.location.pathname).toBe('/partidas');
  });

  it('sem partidas, a lista lateral diz que nenhuma foi jogada', async () => {
    renderStandings({ matches: { body: [] } });

    expect(
      await screen.findByText('Nenhuma partida jogada ainda.'),
    ).toBeInTheDocument();
  });

  it('partidas que não carregam: a classificação continua', async () => {
    renderStandings({ matches: { status: 500, body: { message: 'Erro.' } } });

    expect(
      await screen.findByText('Não foi possível carregar as partidas.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gama SC' })).toBeInTheDocument();
  });

  it('sem clubes: estado vazio, sem a legenda', async () => {
    renderStandings({ standings: { body: [] } });

    expect(
      await screen.findByText('Nenhum clube cadastrado'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^J: jogos/)).not.toBeInTheDocument();
  });

  it('mostra o carregamento e o erro, com nova tentativa', async () => {
    let fail = true;
    renderStandings({
      standings: () =>
        fail
          ? { status: 500, body: { message: 'Erro interno.' } }
          : { body: STANDINGS },
    });

    expect(await screen.findAllByText('Carregando…')).not.toHaveLength(0);
    expect(
      await screen.findByText('Não foi possível carregar a classificação'),
    ).toBeInTheDocument();
    expect(screen.getByText('Erro interno.')).toBeInTheDocument();

    fail = false;
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar de novo' }),
    );

    expect(
      await screen.findByRole('link', { name: 'Gama SC' }),
    ).toBeInTheDocument();
  });

  it('Nova partida abre a mesma janela da tela Partidas', async () => {
    renderStandings();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Nova partida' }),
    );

    expect(
      await screen.findByRole('dialog', { name: 'Nova partida' }),
    ).toBeInTheDocument();
  });
});
