import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Club } from '@/api/clubs';
import type { MatchDetail, MatchSummary } from '@/api/league';
import {
  apiPath,
  mockApiWith,
  requestedUrls,
  sentChanges,
  type MockResponse,
} from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { MatchesPage } from './matches-page';
import { NewMatchDialogProvider } from './new-match-dialog-provider';

function club(id: number, name: string, acronym: string): Club {
  return {
    id,
    name,
    acronym,
    cash: 300,
    squad_value: 0,
    net_worth: 300,
  };
}

const AGUIAS = club(1, 'Águias FC', 'AGU');
const DELTA = club(2, 'Delta FC', 'DEL');
const GAMA = club(3, 'Gama SC', 'GAM');
const CLUBS = [AGUIAS, DELTA, GAMA];

function match(
  id: number,
  playedAt: string,
  home: Club,
  homeGoals: number,
  awayGoals: number,
  away: Club,
): MatchSummary {
  return {
    id,
    played_at: playedAt,
    home: {
      club_id: home.id,
      club_name: home.name,
      formation: '2-1-1',
      goals: homeGoals,
    },
    away: {
      club_id: away.id,
      club_name: away.name,
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

const LATEST = match(3, '2026-11-12T20:00:00-03:00', DELTA, 2, 1, AGUIAS);
const SECOND = match(2, '2026-11-11T20:00:00-03:00', AGUIAS, 1, 2, DELTA);
const DRAW = match(1, '2026-11-10T09:05:00-03:00', DELTA, 0, 0, AGUIAS);
const MATCHES = [LATEST, SECOND, DRAW];

const PLAYED: MatchDetail = { ...LATEST, id: 4, duels: [] };

interface Scenario {
  matches?: (clubId: string | null) => MockResponse;
  clubs?: Club[];
  play?: MockResponse | (() => MockResponse);
}

function renderMatches(scenario: Scenario = {}, path = '/partidas') {
  const fetchMock = mockApiWith((url, init) => {
    const apiRoute = apiPath(url);
    if (apiRoute === '/matches' && init.method === 'POST') {
      const play = scenario.play ?? { status: 201, body: PLAYED };
      return typeof play === 'function' ? play() : play;
    }
    if (apiRoute === '/matches') {
      const clubId = url.searchParams.get('club_id');
      return scenario.matches
        ? scenario.matches(clubId)
        : {
            body:
              clubId === null
                ? MATCHES
                : MATCHES.filter(
                    (item) =>
                      String(item.home.club_id) === clubId ||
                      String(item.away.club_id) === clubId,
                  ),
          };
    }
    return apiRoute === '/clubs'
      ? { body: scenario.clubs ?? CLUBS }
      : undefined;
  });
  const rendered = renderRoutes(
    [
      {
        path: '/partidas',
        element: (
          <NewMatchDialogProvider>
            <MatchesPage />
          </NewMatchDialogProvider>
        ),
      },
      { path: '/partidas/:id', element: <p>Página da partida</p> },
    ],
    path,
  );
  return { fetchMock, ...rendered };
}

function historyTable() {
  return within(
    screen.getByRole('region', { name: 'Histórico de partidas' }),
  ).getByRole('table');
}

function historyRows() {
  return within(historyTable()).getAllByRole('row').slice(1);
}

function matchRequests(fetchMock: ReturnType<typeof mockApiWith>) {
  return requestedUrls(fetchMock).filter(
    (url, index) =>
      apiPath(url) === '/matches' &&
      (fetchMock.mock.calls[index][1]?.method ?? 'GET') === 'GET',
  );
}

async function openDialog() {
  await userEvent.click(
    (await screen.findAllByRole('button', { name: 'Nova partida' }))[0],
  );
  return screen.findByRole('dialog', { name: 'Nova partida' });
}

describe('tela Partidas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lista as partidas na ordem da API, com data, clubes, placar e resultado', async () => {
    renderMatches();
    await screen.findByRole('table');

    const rows = historyRows().map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    );
    expect(rows).toEqual([
      [
        '12/11/202620:00',
        'Delta FCDEL',
        '2 × 1',
        'AGUÁguias FC',
        'Vitória do mandante',
        'Ver duelos',
      ],
      [
        '11/11/202620:00',
        'Águias FCAGU',
        '1 × 2',
        'DELDelta FC',
        'Vitória do visitante',
        'Ver duelos',
      ],
      [
        '10/11/202609:05',
        'Delta FCDEL',
        '0 × 0',
        'AGUÁguias FC',
        'Empate',
        'Ver duelos',
      ],
    ]);
    expect(screen.getByText('3 partidas')).toBeInTheDocument();
  });

  it('destaca o vencedor e, no empate, nenhum dos dois', async () => {
    renderMatches();
    await screen.findByRole('table');
    const [first, , draw] = historyRows();

    expect(within(first).getByText('Delta FC')).toHaveClass('font-semibold');
    expect(within(first).getByText('Águias FC')).not.toHaveClass(
      'font-semibold',
    );
    expect(within(draw).getByText('Delta FC')).not.toHaveClass('font-semibold');
    expect(within(draw).getByText('Águias FC')).not.toHaveClass(
      'font-semibold',
    );
  });

  it('mostra a última partida em destaque, e Ver duelos abre a partida', async () => {
    const { router } = renderMatches();
    const latest = await screen.findByRole('region', {
      name: 'Última partida',
    });

    expect(within(latest).getByText('Delta FC')).toBeInTheDocument();
    expect(within(latest).getByText('Mandante')).toBeInTheDocument();
    expect(within(latest).getByLabelText('2 a 1')).toBeInTheDocument();
    expect(within(latest).getByText('12/11/2026, 20:00')).toBeInTheDocument();
    expect(within(latest).getByText('Vitória do mandante')).toBeInTheDocument();

    await userEvent.click(
      within(latest).getByRole('link', { name: /Ver duelos/ }),
    );

    expect(router.state.location.pathname).toBe('/partidas/3');
  });

  it('com uma partida, o rodapé fica no singular', async () => {
    renderMatches({ matches: () => ({ body: [DRAW] }) });

    expect(await screen.findByText('1 partida')).toBeInTheDocument();
  });

  it('filtra por clube, com o club_id na URL e no pedido', async () => {
    const { fetchMock, router } = renderMatches();
    await screen.findByRole('table');

    await userEvent.click(screen.getByRole('button', { name: 'Clube: todos' }));
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Gama SC' }),
    );

    expect(router.state.location.search).toBe('?club_id=3');
    expect(
      await screen.findByText('Nenhuma partida deste clube'),
    ).toBeInTheDocument();
    expect(
      matchRequests(fetchMock).some(
        (url) => url.searchParams.get('club_id') === '3',
      ),
    ).toBe(true);
    expect(
      screen.getByRole('region', { name: 'Última partida' }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Ver todas as partidas' }),
    );

    expect(router.state.location.search).toBe('');
    expect(await screen.findByText('3 partidas')).toBeInTheDocument();
  });

  it('abre com o filtro da URL', async () => {
    renderMatches({}, '/partidas?club_id=1');

    expect(
      await screen.findByRole('button', { name: 'Clube: Águias FC' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('3 partidas')).toBeInTheDocument();
  });

  it('ignora club_id fora do formato na URL', async () => {
    const { fetchMock } = renderMatches({}, '/partidas?club_id=abc');

    await screen.findByText('3 partidas');

    expect(
      matchRequests(fetchMock).every((url) => !url.searchParams.has('club_id')),
    ).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Clube: todos' }),
    ).toBeInTheDocument();
  });

  it('filtro recusado: mostra o message e o caminho de volta', async () => {
    const { router } = renderMatches(
      {
        matches: (clubId) =>
          clubId === null
            ? { body: MATCHES }
            : { status: 404, body: { message: 'Clube não encontrado.' } },
      },
      '/partidas?club_id=999',
    );

    expect(
      await screen.findByText('O filtro foi recusado'),
    ).toBeInTheDocument();
    expect(screen.getByText('Clube não encontrado.')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Ver todas as partidas' }),
    );

    expect(router.state.location.search).toBe('');
    expect(await screen.findByText('3 partidas')).toBeInTheDocument();
  });

  it('sem partidas: estado vazio, sem destaque, com o botão para jogar a primeira', async () => {
    renderMatches({ matches: () => ({ body: [] }) });

    expect(
      await screen.findByText('Nenhuma partida jogada'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Última partida' }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getAllByRole('button', { name: 'Nova partida' })[1],
    );

    expect(
      await screen.findByRole('dialog', { name: 'Nova partida' }),
    ).toBeInTheDocument();
  });

  it('mostra o carregamento e o erro, com nova tentativa', async () => {
    let fail = true;
    renderMatches({
      matches: () =>
        fail
          ? { status: 500, body: { message: 'Erro interno.' } }
          : { body: MATCHES },
    });

    expect(await screen.findByText('Carregando…')).toBeInTheDocument();
    expect(
      await screen.findByText('Não foi possível carregar as partidas'),
    ).toBeInTheDocument();

    fail = false;
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar de novo' }),
    );

    expect(await screen.findByText('3 partidas')).toBeInTheDocument();
  });
});

describe('janela Nova partida', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('oferece os clubes com a sigla e explica como sai o placar', async () => {
    renderMatches();
    const dialog = await openDialog();

    const home = within(dialog).getByLabelText('Mandante');
    await waitFor(() =>
      expect(
        within(home)
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual([
        'Escolha o mandante',
        'Águias FC (AGU)',
        'Delta FC (DEL)',
        'Gama SC (GAM)',
      ]),
    );
    expect(
      within(dialog).getByText('Faz os 3 primeiros ataques.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Como sai o placar')).toBeInTheDocument();
  });

  it('sem clubes, avisa no seletor', async () => {
    renderMatches({ clubs: [] });
    const dialog = await openDialog();

    await waitFor(() =>
      expect(within(dialog).getByLabelText('Mandante')).toHaveDisplayValue(
        'Nenhum clube cadastrado',
      ),
    );
  });

  it('exige os dois clubes antes de enviar', async () => {
    const { fetchMock } = renderMatches();
    const dialog = await openDialog();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Jogar partida' }),
    );

    expect(
      await within(dialog).findByText('Escolha o mandante.'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('Escolha o visitante.'),
    ).toBeInTheDocument();
    expect(sentChanges(fetchMock)).toEqual([]);
  });

  it('recusa o mesmo clube dos dois lados antes de enviar', async () => {
    const { fetchMock } = renderMatches();
    const dialog = await openDialog();
    await waitFor(() =>
      expect(within(dialog).getAllByRole('option').length).toBeGreaterThan(2),
    );

    await userEvent.selectOptions(
      within(dialog).getByLabelText('Mandante'),
      '1',
    );
    await userEvent.selectOptions(
      within(dialog).getByLabelText('Visitante'),
      '1',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Jogar partida' }),
    );

    expect(
      await within(dialog).findByText(
        'Escolha um clube diferente do mandante.',
      ),
    ).toBeInTheDocument();
    expect(sentChanges(fetchMock)).toEqual([]);
  });

  async function choose(dialog: HTMLElement, home: string, away: string) {
    await waitFor(() =>
      expect(within(dialog).getAllByRole('option').length).toBeGreaterThan(2),
    );
    await userEvent.selectOptions(
      within(dialog).getByLabelText('Mandante'),
      home,
    );
    await userEvent.selectOptions(
      within(dialog).getByLabelText('Visitante'),
      away,
    );
  }

  it('joga, avisa o placar devolvido e abre a página da partida', async () => {
    const { fetchMock, router } = renderMatches();
    const dialog = await openDialog();
    await choose(dialog, '2', '1');

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Jogar partida' }),
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/partidas/4'),
    );
    expect(await screen.findByText('Partida jogada')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Delta FC 2 × 1 Águias FC. Placar e duelos devolvidos pela API.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sentChanges(fetchMock)).toEqual([
      {
        method: 'POST',
        path: '/matches',
        body: { home_club_id: 2, away_club_id: 1 },
      },
    ]);
  });

  it('escalação incompleta: mostra o message da API e continua aberta', async () => {
    renderMatches({
      play: {
        status: 409,
        body: {
          message:
            'O Gama SC não tem a escalação completa, com os 5 titulares.',
        },
      },
    });
    const dialog = await openDialog();
    await choose(dialog, '3', '1');

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Jogar partida' }),
    );

    expect(
      await within(dialog).findByText('Não foi possível jogar a partida'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'O Gama SC não tem a escalação completa, com os 5 titulares.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Mandante')).toHaveDisplayValue(
      'Gama SC (GAM)',
    );
  });

  it('recusa de um campo: mostra o erro junto ao campo', async () => {
    renderMatches({
      play: {
        status: 400,
        body: { message: 'away_club_id: deve ser diferente de home_club_id' },
      },
    });
    const dialog = await openDialog();
    await choose(dialog, '2', '1');

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Jogar partida' }),
    );

    expect(
      await within(dialog).findByText('Deve ser diferente de home_club_id.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Visitante')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('sem conexão: avisa e joga na nova tentativa', async () => {
    let fail = true;
    const { fetchMock, router } = renderMatches({
      play: () =>
        fail ? { networkError: true } : { status: 201, body: PLAYED },
    });
    const dialog = await openDialog();
    await choose(dialog, '2', '1');

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Jogar partida' }),
    );

    expect(await within(dialog).findByText('Sem conexão')).toBeInTheDocument();

    fail = false;
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Tentar de novo' }),
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/partidas/4'),
    );
    expect(sentChanges(fetchMock)).toHaveLength(2);
  });

  it('trava os botões enquanto joga e manda um só pedido no clique duplo', async () => {
    const { fetchMock } = renderMatches({
      play: { status: 201, body: PLAYED, delayMs: 200 },
    });
    const dialog = await openDialog();
    await choose(dialog, '2', '1');

    await userEvent.dblClick(
      within(dialog).getByRole('button', { name: 'Jogar partida' }),
    );

    expect(
      within(dialog).getByRole('button', { name: 'Jogando…' }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    ).toBeDisabled();
    expect(await screen.findByText('Partida jogada')).toBeInTheDocument();
    expect(sentChanges(fetchMock)).toHaveLength(1);
  });

  it('Cancelar fecha sem enviar nada, e a janela abre de novo vazia', async () => {
    const { fetchMock } = renderMatches();
    const dialog = await openDialog();
    await choose(dialog, '2', '1');

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(sentChanges(fetchMock)).toEqual([]);

    const reopened = await openDialog();
    expect(within(reopened).getByLabelText('Mandante')).toHaveDisplayValue(
      'Escolha o mandante',
    );
  });
});
