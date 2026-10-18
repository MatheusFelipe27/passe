import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Club } from '@/api/clubs';
import type { MatchDetail } from '@/api/league';
import { apiPath, mockApiWith, type MockResponse } from '@/test/fetch-mock';
import { RN20_MATCH } from '@/test/match-example';
import { renderRoutes } from '@/test/render';
import { MatchCrumb } from './match-crumb';
import { MatchPage } from './match-page';

const CLUBS: Club[] = [
  {
    id: 1,
    name: 'Águias FC',
    acronym: 'AGU',
    cash: 300,
    squad_value: 0,
    net_worth: 300,
  },
  {
    id: 2,
    name: 'Delta FC',
    acronym: 'DEL',
    cash: 300,
    squad_value: 0,
    net_worth: 300,
  },
];

function renderMatch(
  match: MockResponse | (() => MockResponse) = { body: RN20_MATCH },
  path = '/partidas/1',
) {
  mockApiWith((url) => {
    const route = apiPath(url);
    if (route.startsWith('/matches/')) {
      return typeof match === 'function' ? match() : match;
    }
    return route === '/clubs' ? { body: CLUBS } : undefined;
  });
  return renderRoutes(
    [
      {
        path: '/partidas/:id',
        element: (
          <>
            <nav aria-label="Trilha">
              <MatchCrumb />
            </nav>
            <MatchPage />
          </>
        ),
      },
      { path: '/partidas', element: <p>Lista de partidas</p> },
    ],
    path,
  );
}

function duelRows(group: string) {
  const body = screen.getByRole('rowgroup', { name: group });
  return within(body)
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    );
}

function groupHeader(group: string) {
  const body = screen.getByRole('rowgroup', { name: group });
  return within(body).getAllByRole('row')[0].textContent;
}

describe('página da partida', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra o placar, a data, o resultado e as formações', async () => {
    renderMatch();
    const scoreboard = await screen.findByRole('region', { name: 'Placar' });

    expect(within(scoreboard).getByLabelText('1 a 2')).toBeInTheDocument();
    expect(
      within(scoreboard).getByText('Mandante · 2-1-1'),
    ).toBeInTheDocument();
    expect(
      within(scoreboard).getByText('Visitante · 2-1-1'),
    ).toBeInTheDocument();
    expect(
      within(scoreboard).getByText('12/11/2026, 15:00'),
    ).toBeInTheDocument();
    expect(
      within(scoreboard).getByText('Vitória do visitante'),
    ).toBeInTheDocument();
    expect(await within(scoreboard).findByText('AGU')).toBeInTheDocument();
  });

  it('a trilha mostra o placar da partida, e "Partida" enquanto carrega', async () => {
    renderMatch({ body: RN20_MATCH, delayMs: 100 });
    const trail = screen.getByRole('navigation', { name: 'Trilha' });

    expect(trail).toHaveTextContent('Partida');
    expect(
      await within(trail).findByText('Águias FC 1 × 2 Delta FC'),
    ).toBeInTheDocument();
  });

  it('mostra os 6 duelos como a API devolveu, em dois grupos, com a vaga de cada jogador', async () => {
    renderMatch();
    await screen.findByRole('region', { name: 'Duelos' });

    expect(groupHeader('Ataques do Águias FC')).toBe(
      'AGUAtaques do Águias FC (mandante)1 gol',
    );
    expect(duelRows('Ataques do Águias FC')).toEqual([
      [
        '1',
        'OROtto RangelATA, 4º de linha · Águias FC',
        'Finalização 75',
        'ITIvo TelesGoleiro · Delta FC',
        'Defesa 72',
        'Gol',
      ],
      [
        '2',
        'LNLauro NevesMEI, 3º de linha · Águias FC',
        'Passe 82',
        'HVHugo VazZAG, 1º de linha · Delta FC',
        'Defesa 84',
        'Sem gol',
      ],
      [
        '3',
        'DLDavi LinsLAT, 2º de linha · Águias FC',
        'Drible 63',
        'LMLino MatosLAT, 2º de linha · Delta FC',
        'Defesa 63',
        'Sem gol',
      ],
    ]);
    expect(groupHeader('Ataques do Delta FC')).toBe(
      'DELAtaques do Delta FC (visitante)2 gols',
    );
    expect(duelRows('Ataques do Delta FC').map((row) => row[0])).toEqual([
      '4',
      '5',
      '6',
    ]);
    expect(duelRows('Ataques do Delta FC')[2]).toEqual([
      '6',
      'LMLino MatosLAT, 2º de linha · Delta FC',
      'Drible 79',
      'DLDavi LinsLAT, 2º de linha · Águias FC',
      'Defesa 56',
      'Gol',
    ]);
  });

  it('marca quem jogou mal condicionado nos duelos', async () => {
    renderMatch();
    const duels = await screen.findByRole('region', { name: 'Duelos' });

    expect(within(duels).getAllByLabelText('Mal condicionado')).toHaveLength(2);
  });

  it('sem gol de um lado, o grupo diz "nenhum gol"', async () => {
    const shutout: MatchDetail = {
      ...RN20_MATCH,
      home: { ...RN20_MATCH.home, goals: 0 },
      result: 'VISITANTE',
      duels: RN20_MATCH.duels.map((duel) =>
        duel.attacking_club_id === 1 ? { ...duel, goal: false } : duel,
      ),
    };
    renderMatch({ body: shutout });
    await screen.findByRole('region', { name: 'Duelos' });

    expect(groupHeader('Ataques do Águias FC')).toMatch(/nenhum gol$/);
  });

  it('o campo mostra os 10 titulares com os valores usados e os selos', async () => {
    renderMatch();
    const pitch = await screen.findByRole('img', {
      name: 'Titulares dos dois clubes no campo',
    });

    for (const name of [
      'Rui Prado',
      'Téo Brandão',
      'Davi Lins',
      'Lauro Neves',
      'Otto Rangel',
      'Ivo Teles',
      'Hugo Vaz',
      'Lino Matos',
      'Nei Soares',
      'Ugo Falcão',
    ]) {
      expect(within(pitch).getByText(name)).toBeInTheDocument();
    }
    expect(
      within(pitch).getByText('LAT · Dri 63 · Def 56'),
    ).toBeInTheDocument();
    expect(
      within(pitch).getByText('LAT · Dri 79 · Def 63'),
    ).toBeInTheDocument();
    expect(within(pitch).getByText('GOL · Def 77')).toBeInTheDocument();
    expect(within(pitch).getByText('ATA · Fin 81')).toBeInTheDocument();
    expect(within(pitch).getAllByTitle('Mal condicionado')).toHaveLength(1);
    expect(within(pitch).getAllByTitle('Gol no duelo')).toHaveLength(3);
    expect(within(pitch).getByText('Águias FC')).toBeInTheDocument();
  });

  it('partida inexistente: mostra o message e o caminho de volta', async () => {
    const { router } = renderMatch(
      { status: 404, body: { message: 'Partida não encontrada.' } },
      '/partidas/999',
    );

    expect(
      await screen.findByText('Partida não encontrada'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Partida não encontrada. O endereço pode estar errado ou a partida não existe.',
      ),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('link', { name: 'Voltar para partidas' }),
    );

    expect(router.state.location.pathname).toBe('/partidas');
  });

  it('mostra o carregamento e o erro, com nova tentativa', async () => {
    let fail = true;
    renderMatch(() =>
      fail
        ? { status: 500, body: { message: 'Erro interno.' } }
        : { body: RN20_MATCH },
    );

    expect(await screen.findByText('Carregando…')).toBeInTheDocument();
    expect(
      await screen.findByText('Não foi possível carregar a partida'),
    ).toBeInTheDocument();

    fail = false;
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar de novo' }),
    );

    expect(
      await screen.findByRole('region', { name: 'Duelos' }),
    ).toBeInTheDocument();
  });

  it('Voltar para partidas leva à lista', async () => {
    const { router } = renderMatch();
    await screen.findByRole('region', { name: 'Duelos' });

    await userEvent.click(
      screen.getByRole('link', { name: 'Voltar para partidas' }),
    );

    expect(router.state.location.pathname).toBe('/partidas');
  });
});
