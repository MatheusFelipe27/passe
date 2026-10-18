import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Club, ClubDetail, RosterPlayer } from '@/api/clubs';
import type { Lineup } from '@/api/league';
import type { Sale } from '@/api/market';
import type { Player } from '@/api/players';
import {
  apiPath,
  mockApiWith,
  requestedUrls,
  type MockResponse,
} from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { ClubPage } from '@/features/clubs/club-page';
import { PlayersPage } from '@/features/players/players-page';

const MOURA: RosterPlayer = {
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

const FREE: Player = {
  ...MOURA,
  id: 7,
  name: 'Ênio Carvalho',
  position: 'LAT',
  club_id: null,
};

const AGUIAS: Club = {
  id: 1,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 51.58,
  squad_value: 52,
  net_worth: 103.58,
};

const AGUIAS_DETAIL: ClubDetail = { ...AGUIAS, players: [MOURA] };

function lineupWith(players: Player[]): Lineup {
  return {
    club_id: 1,
    formation: '2-1-1',
    complete: players.length === 5,
    players,
  };
}

const STARTER = lineupWith([MOURA]);
const RESERVE = lineupWith([]);

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

const NO_PENALTY: Sale = {
  ...SALE,
  penalty: 0,
  remaining_days: 0,
  penalty_rate: 0,
  contract_status: 'ENCERRADO',
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

const WARNING_TITLE = 'Felipe Moura é titular';

function lineupGets(fetchMock: ReturnType<typeof mockApiWith>) {
  return requestedUrls(fetchMock).filter((url) =>
    apiPath(url).endsWith('/lineup'),
  ).length;
}

function renderPlayers(lineup: MockResponse) {
  const fetchMock = mockApiWith((url) => {
    const path = apiPath(url);
    if (path === '/players') {
      return {
        body: {
          data: [MOURA, FREE],
          meta: { page: 1, limit: 10, total_items: 2, total_pages: 1 },
        },
      };
    }
    if (path === '/clubs') {
      return { body: [AGUIAS] };
    }
    return path === '/clubs/1/lineup' ? lineup : undefined;
  });
  renderRoutes(
    [{ path: '/jogadores', element: <PlayersPage /> }],
    '/jogadores',
  );
  return fetchMock;
}

async function openCondition(playerName: string) {
  await userEvent.click(
    await screen.findByRole('button', { name: `Ações de ${playerName}` }),
  );
  await userEvent.click(
    await screen.findByRole('menuitem', { name: 'Alterar condição' }),
  );
  return screen.findByRole('dialog', { name: 'Alterar condição física' });
}

function renderClub(lineup: MockResponse, sale: Sale = SALE) {
  const fetchMock = mockApiWith((url, init) => {
    const path = apiPath(url);
    if (init.method === 'POST' && path === '/players/3/sell') {
      return { body: sale };
    }
    if (path === '/clubs/1/lineup') {
      return lineup;
    }
    if (path === '/clubs/1/transactions') {
      return { body: EMPTY_HISTORY };
    }
    return path === '/clubs/1' ? { body: AGUIAS_DETAIL } : undefined;
  });
  renderRoutes([{ path: '/clubes/:id', element: <ClubPage /> }], '/clubes/1');
  return fetchMock;
}

async function openSell() {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Vender Felipe Moura' }),
  );
  return screen.findByRole('dialog', { name: 'Vender Felipe Moura?' });
}

describe('aviso de titular ao alterar a condição (J16)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('avisa só quando o titular passa a Doente', async () => {
    renderPlayers({ body: STARTER });
    const dialog = await openCondition('Felipe Moura');

    expect(within(dialog).queryByText(WARNING_TITLE)).not.toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('radio', { name: /Doente/ }),
    );

    expect(await within(dialog).findByText(WARNING_TITLE)).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Ao passar a Doente, ele sai da escalação, e o Águias FC só volta a jogar partidas depois de escalar de novo os 5 titulares.',
      ),
    ).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('radio', { name: /Mal condicionado/ }),
    );

    expect(within(dialog).queryByText(WARNING_TITLE)).not.toBeInTheDocument();
  });

  it('reserva que passa a Doente: sem aviso', async () => {
    const fetchMock = renderPlayers({ body: RESERVE });
    const dialog = await openCondition('Felipe Moura');
    await waitFor(() => expect(lineupGets(fetchMock)).toBe(1));

    await userEvent.click(
      within(dialog).getByRole('radio', { name: /Doente/ }),
    );

    expect(within(dialog).queryByText(WARNING_TITLE)).not.toBeInTheDocument();
  });

  it('jogador livre: nem busca escalação', async () => {
    const fetchMock = renderPlayers({ body: STARTER });
    const dialog = await openCondition('Ênio Carvalho');

    await userEvent.click(
      within(dialog).getByRole('radio', { name: /Doente/ }),
    );

    expect(within(dialog).queryByText(/é titular/)).not.toBeInTheDocument();
    expect(lineupGets(fetchMock)).toBe(0);
  });

  it('escalação que não carrega: sem aviso, e a condição continua alterável', async () => {
    const fetchMock = renderPlayers({
      status: 500,
      body: { message: 'Erro interno.' },
    });
    const dialog = await openCondition('Felipe Moura');
    await waitFor(() => expect(lineupGets(fetchMock)).toBe(1));

    await userEvent.click(
      within(dialog).getByRole('radio', { name: /Doente/ }),
    );

    expect(within(dialog).queryByText(WARNING_TITLE)).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Salvar condição' }),
    ).toBeEnabled();
  });
});

describe('aviso de titular na venda (V01 e V02)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('titular: avisa na confirmação e diz no resultado que saiu da escalação', async () => {
    renderClub({ body: STARTER });
    const dialog = await openSell();

    expect(await within(dialog).findByText(WARNING_TITLE)).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Ao vender, ele sai da escalação, e o Águias FC só volta a jogar partidas depois de escalar de novo os 5 titulares.',
      ),
    ).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Confirmar venda' }),
    );

    expect(
      await screen.findByText(
        'Felipe Moura voltou a ficar livre e saiu da escalação.',
      ),
    ).toBeInTheDocument();
  });

  it('titular com a fidelidade cumprida: as duas informações no resultado', async () => {
    renderClub({ body: STARTER }, NO_PENALTY);
    const dialog = await openSell();
    await within(dialog).findByText(WARNING_TITLE);

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Confirmar venda' }),
    );

    expect(
      await screen.findByText(
        'Felipe Moura voltou a ficar livre e saiu da escalação. A fidelidade já tinha terminado, então não houve multa.',
      ),
    ).toBeInTheDocument();
  });

  it('reserva: sem aviso, e o resultado não fala da escalação', async () => {
    const fetchMock = renderClub({ body: RESERVE });
    const dialog = await openSell();
    await waitFor(() => expect(lineupGets(fetchMock)).toBe(1));

    expect(within(dialog).queryByText(WARNING_TITLE)).not.toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Confirmar venda' }),
    );

    expect(
      await screen.findByText('Felipe Moura voltou a ficar livre.'),
    ).toBeInTheDocument();
  });

  it('escalação que não carrega: a venda segue, sem aviso', async () => {
    const fetchMock = renderClub({
      status: 500,
      body: { message: 'Erro interno.' },
    });
    const dialog = await openSell();
    await waitFor(() => expect(lineupGets(fetchMock)).toBe(1));
    expect(within(dialog).queryByText(WARNING_TITLE)).not.toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Confirmar venda' }),
    );

    expect(
      await screen.findByText('Felipe Moura voltou a ficar livre.'),
    ).toBeInTheDocument();
  });

  it('a venda faz a escalação do clube ser buscada de novo', async () => {
    const fetchMock = renderClub({ body: STARTER });
    const dialog = await openSell();
    await within(dialog).findByText(WARNING_TITLE);
    const before = lineupGets(fetchMock);

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Confirmar venda' }),
    );

    await screen.findByText(/saiu da escalação/);
    await waitFor(() => expect(lineupGets(fetchMock)).toBe(before + 1));
  });
});
