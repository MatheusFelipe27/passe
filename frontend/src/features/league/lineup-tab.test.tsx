import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClubDetail, RosterPlayer } from '@/api/clubs';
import type { Lineup } from '@/api/league';
import type { Condition, Position } from '@/api/players';
import {
  apiPath,
  mockApiWith,
  requestedUrls,
  sentChanges,
  type MockResponse,
} from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { ClubPage } from '@/features/clubs/club-page';

function rosterPlayer(
  id: number,
  name: string,
  position: Position,
  values: Partial<RosterPlayer> = {},
  condition: Condition = 'APTO',
): RosterPlayer {
  return {
    id,
    name,
    position,
    agility: 60,
    age: 25,
    condition,
    base_value: 30,
    market_value: 30,
    pace: 60,
    shooting: 60,
    passing: 60,
    dribbling: 60,
    defending: 60,
    physical: 60,
    potential: 80,
    overall: 70,
    club_id: 1,
    contract: null,
    ...values,
  };
}

// O elenco do C06: 6 jogadores na ordem do elenco, com o Lucas Ferraz DOENTE.
const TAVARES = rosterPlayer(8, 'Bruno Tavares', 'GOL', {
  defending: 77,
  overall: 71,
});
const MOURA = rosterPlayer(3, 'Felipe Moura', 'ZAG', {
  defending: 83,
  overall: 77,
});
const RAMOS = rosterPlayer(
  4,
  'Diego Ramos',
  'LAT',
  { dribbling: 74, defending: 66, overall: 72 },
  'MAL_CONDICIONADO',
);
const FERRAZ = rosterPlayer(6, 'Lucas Ferraz', 'MEI', {}, 'DOENTE');
const LIMA = rosterPlayer(
  5,
  'Sávio Lima',
  'MEI',
  { passing: 70, overall: 66 },
  'MAL_CONDICIONADO',
);
const SILVA = rosterPlayer(9, 'João Silva', 'ATA', {
  shooting: 79,
  overall: 77,
});

const ROSTER = [TAVARES, MOURA, RAMOS, FERRAZ, LIMA, SILVA];

function club(players: RosterPlayer[] = ROSTER): ClubDetail {
  return {
    id: 1,
    name: 'Águias FC',
    acronym: 'AGU',
    cash: 51.58,
    squad_value: 222.68,
    net_worth: 274.26,
    players,
  };
}

const SAVED: Lineup = {
  club_id: 1,
  formation: '2-1-1',
  complete: true,
  players: [TAVARES, MOURA, RAMOS, LIMA, SILVA],
};

const NONE: Lineup = {
  club_id: 1,
  formation: null,
  complete: false,
  players: [],
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

interface Scenario {
  club?: ClubDetail;
  lineup?: MockResponse | (() => MockResponse);
  save?: MockResponse;
}

function renderLineup(scenario: Scenario = {}) {
  const fetchMock = mockApiWith((url, init) => {
    const path = apiPath(url);
    if (path === '/clubs/1/lineup') {
      if (init.method === 'PUT') {
        return scenario.save ?? { body: SAVED };
      }
      const lineup = scenario.lineup ?? { body: SAVED };
      return typeof lineup === 'function' ? lineup() : lineup;
    }
    if (path === '/clubs/1/transactions') {
      return { body: EMPTY_HISTORY };
    }
    return path === '/clubs/1' ? { body: scenario.club ?? club() } : undefined;
  });
  renderRoutes(
    [{ path: '/clubes/:id', element: <ClubPage /> }],
    '/clubes/1?tab=escalacao',
  );
  return fetchMock;
}

function slot(name: string) {
  return screen.getByRole('combobox', { name });
}

async function waitForEditor() {
  return screen.findByRole('combobox', { name: 'Goleiro' });
}

function optionsOf(name: string) {
  return within(slot(name))
    .getAllByRole('option')
    .map((option) => option.textContent);
}

// Só as consultas: o PUT da escalação usa o mesmo caminho.
function lineupGets(fetchMock: ReturnType<typeof renderLineup>) {
  return fetchMock.mock.calls.filter(
    ([input, init]) =>
      (init?.method ?? 'GET') === 'GET' &&
      apiPath(new URL(String(input))) === '/clubs/1/lineup',
  ).length;
}

function clubGets(fetchMock: ReturnType<typeof renderLineup>) {
  return requestedUrls(fetchMock).filter((url) => apiPath(url) === '/clubs/1')
    .length;
}

function rowOf(name: string) {
  return slot(name).closest('tr')!;
}

describe('aba Escalação', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('abre pelo clique na aba e fica na URL', async () => {
    mockApiWith((url) => {
      const path = apiPath(url);
      if (path === '/clubs/1/lineup') {
        return { body: SAVED };
      }
      if (path === '/clubs/1/transactions') {
        return { body: EMPTY_HISTORY };
      }
      return path === '/clubs/1' ? { body: club() } : undefined;
    });
    const { router } = renderRoutes(
      [{ path: '/clubes/:id', element: <ClubPage /> }],
      '/clubes/1',
    );

    await userEvent.click(
      await screen.findByRole('tab', { name: 'Escalação' }),
    );

    expect(await waitForEditor()).toBeInTheDocument();
    expect(router.state.location.search).toBe('?tab=escalacao');
  });

  it('mostra a escalação salva: formação, titulares, condição, overall e atributos', async () => {
    renderLineup();
    await waitForEditor();

    expect(screen.getByRole('radio', { name: /^2-1-1/ })).toBeChecked();
    expect(screen.getByText('Completa')).toBeInTheDocument();
    expect(slot('Goleiro')).toHaveDisplayValue('Bruno Tavares (GOL)');
    expect(slot('Defesa 1')).toHaveDisplayValue('Felipe Moura (ZAG)');
    expect(slot('Defesa 2')).toHaveDisplayValue('Diego Ramos (LAT)');
    expect(slot('Meio')).toHaveDisplayValue('Sávio Lima (MEI)');
    expect(slot('Ataque')).toHaveDisplayValue('João Silva (ATA)');
    const ramos = within(rowOf('Defesa 2'));
    expect(ramos.getByText('Mal condicionado')).toBeInTheDocument();
    expect(ramos.getByText('72')).toBeInTheDocument();
    expect(rowOf('Defesa 2')).toHaveTextContent('Drible 74Defesa 66');
    expect(rowOf('Ataque')).toHaveTextContent('Finalização 79');
    expect(rowOf('Meio')).toHaveTextContent('Passe 70');
  });

  it('avisa os titulares mal condicionados', async () => {
    renderLineup();
    await waitForEditor();

    expect(
      screen.getByText('Diego Ramos e Sávio Lima estão mal condicionados'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Podem jogar, mas cada atributo vale 15% a menos durante a partida.',
      ),
    ).toBeInTheDocument();
  });

  it('com um só mal condicionado, o aviso fica no singular; sem nenhum, não aparece', async () => {
    renderLineup({
      club: club([
        TAVARES,
        MOURA,
        RAMOS,
        { ...LIMA, condition: 'APTO' },
        SILVA,
      ]),
      lineup: {
        body: {
          ...SAVED,
          players: [
            TAVARES,
            MOURA,
            RAMOS,
            { ...LIMA, condition: 'APTO' },
            SILVA,
          ],
        },
      },
    });
    await waitForEditor();

    expect(
      screen.getByText('Diego Ramos está mal condicionado'),
    ).toBeInTheDocument();

    await userEvent.selectOptions(slot('Defesa 2'), '');

    expect(screen.queryByText(/mal condicionad/)).not.toBeInTheDocument();
  });

  it('mostra os reservas, com o aviso de que DOENTE não pode ser escalado', async () => {
    renderLineup();
    await waitForEditor();

    const bench = screen.getByRole('list', { name: 'Reservas' });
    expect(within(bench).getByText('Lucas Ferraz')).toBeInTheDocument();
    expect(within(bench).getByText('Doente')).toBeInTheDocument();
    expect(
      screen.getByText('Doente não pode ser escalado.'),
    ).toBeInTheDocument();
  });

  it('sem reservas, diz que todo o elenco está escolhido', async () => {
    renderLineup({ club: club([TAVARES, MOURA, RAMOS, LIMA, SILVA]) });
    await waitForEditor();

    expect(
      screen.getByText(
        'Nenhum reserva: os 5 jogadores do elenco estão escolhidos.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Doente não pode ser escalado.'),
    ).not.toBeInTheDocument();
  });

  it('cada vaga oferece só a posição dela, sem DOENTE e sem quem já está em outra vaga', async () => {
    renderLineup();
    await waitForEditor();

    expect(optionsOf('Meio')).toEqual([
      'Escolha o titular',
      'Sávio Lima (MEI)',
    ]);
    expect(optionsOf('Defesa 1')).toEqual([
      'Escolha o titular',
      'Felipe Moura (ZAG)',
    ]);

    await userEvent.selectOptions(slot('Defesa 2'), '');

    expect(optionsOf('Defesa 1')).toEqual([
      'Escolha o titular',
      'Felipe Moura (ZAG)',
      'Diego Ramos (LAT)',
    ]);
  });

  it('vaga sem candidato fica desativada, dizendo se falta no elenco ou se já foi escolhido', async () => {
    const twoPlayers = [TAVARES, SILVA];
    renderLineup({ club: club(twoPlayers), lineup: { body: NONE } });
    await waitForEditor();

    expect(slot('Meio')).toBeDisabled();
    expect(slot('Meio')).toHaveDisplayValue('Sem MEI no elenco');
    expect(slot('Defesa 1')).toHaveDisplayValue('Sem ZAG ou LAT no elenco');
    expect(slot('Goleiro')).toBeEnabled();

    await userEvent.selectOptions(slot('Goleiro'), '8');
    await userEvent.click(screen.getByRole('radio', { name: /^2-2/ }));

    expect(slot('Ataque 1')).toBeEnabled();
    await userEvent.selectOptions(slot('Ataque 1'), '9');
    expect(slot('Ataque 2')).toBeDisabled();
    expect(slot('Ataque 2')).toHaveDisplayValue('Sem ATA disponível');
  });

  it('clube que nunca escalou: 2-1-1 marcada, vagas vazias, incompleta e sem poder salvar', async () => {
    renderLineup({ lineup: { body: NONE } });
    await waitForEditor();

    expect(screen.getByRole('radio', { name: /^2-1-1/ })).toBeChecked();
    for (const name of ['Goleiro', 'Defesa 1', 'Defesa 2', 'Meio', 'Ataque']) {
      expect(slot(name)).toHaveDisplayValue('Escolha o titular');
    }
    expect(screen.getByText('Incompleta')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Escalação incompleta: o Águias FC não pode jogar partidas',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'O clube ainda não escalou. Escolha a formação e os 5 titulares e salve a escalação.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Escolha a formação e um titular para cada vaga para salvar.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Salvar escalação' }),
    ).toBeDisabled();
  });

  it('elenco com menos de 5: diz quantos jogadores tem', async () => {
    renderLineup({ club: club([TAVARES, SILVA]), lineup: { body: NONE } });
    await waitForEditor();

    expect(
      screen.getByText(
        'O elenco tem 2 jogadores, e a escalação precisa de 5: 1 goleiro e 4 jogadores de linha. Compre jogadores e salve a escalação com os 5 titulares.',
      ),
    ).toBeInTheDocument();
  });

  it('elenco com 1 jogador: singular', async () => {
    renderLineup({ club: club([TAVARES]), lineup: { body: NONE } });
    await waitForEditor();

    expect(screen.getByText(/^O elenco tem 1 jogador,/)).toBeInTheDocument();
  });

  it('elenco vazio: diz que ainda não tem jogadores', async () => {
    renderLineup({ club: club([]), lineup: { body: NONE } });
    await waitForEditor();

    expect(
      screen.getByText(
        'O elenco ainda não tem jogadores, e a escalação precisa de 5: 1 goleiro e 4 jogadores de linha. Compre jogadores e salve a escalação com os 5 titulares.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('O clube ainda não tem jogadores.'),
    ).toBeInTheDocument();
  });

  it('5 ou mais jogadores que não fecham formação sem os DOENTE', async () => {
    renderLineup({
      club: club([
        TAVARES,
        MOURA,
        RAMOS,
        FERRAZ,
        { ...SILVA, condition: 'DOENTE' },
      ]),
      lineup: { body: NONE },
    });
    await waitForEditor();

    expect(
      screen.getByText(
        'Sem os jogadores DOENTE, o elenco não fecha nenhuma formação. Compre jogadores e salve a escalação com os 5 titulares.',
      ),
    ).toBeInTheDocument();
  });

  it('incompleta depois de uma venda: a formação continua salva com os titulares que sobraram', async () => {
    renderLineup({
      club: club([TAVARES, RAMOS, FERRAZ, LIMA, SILVA]),
      lineup: {
        body: {
          ...SAVED,
          complete: false,
          players: [TAVARES, RAMOS, LIMA, SILVA],
        },
      },
    });
    await waitForEditor();

    expect(screen.getByRole('radio', { name: /^2-1-1/ })).toBeChecked();
    expect(screen.getByText('Incompleta')).toBeInTheDocument();
    expect(
      screen.getByText(
        'A 2-1-1 continua salva, com 4 titulares: titular vendido ou que fica DOENTE sai da escalação e não volta sozinho. Sem os jogadores DOENTE, o elenco não fecha nenhuma formação: o clube precisa comprar um jogador e escalar de novo.',
      ),
    ).toBeInTheDocument();
    expect(slot('Defesa 1')).toHaveDisplayValue('Diego Ramos (LAT)');
    expect(slot('Defesa 2')).toHaveDisplayValue('Sem ZAG ou LAT disponível');
    expect(
      screen.getByRole('button', { name: 'Salvar escalação' }),
    ).toBeDisabled();
  });

  it('incompleta com reserva que pode entrar: pede para escalar de novo', async () => {
    renderLineup({
      lineup: {
        body: {
          ...SAVED,
          complete: false,
          players: [TAVARES, RAMOS, LIMA, SILVA],
        },
      },
    });
    await waitForEditor();

    expect(
      screen.getByText(
        'A 2-1-1 continua salva, com 4 titulares: titular vendido ou que fica DOENTE sai da escalação e não volta sozinho. Escolha quem entra na vaga e salve a escalação de novo.',
      ),
    ).toBeInTheDocument();
  });

  it('com 1 titular restante, o texto fica no singular', async () => {
    renderLineup({
      lineup: { body: { ...SAVED, complete: false, players: [TAVARES] } },
    });
    await waitForEditor();

    expect(screen.getByText(/com 1 titular:/)).toBeInTheDocument();
  });

  it('trocar a formação mantém quem cabe nas vagas novas', async () => {
    renderLineup();
    await waitForEditor();

    await userEvent.click(screen.getByRole('radio', { name: /^1-2-1/ }));

    expect(slot('Goleiro')).toHaveDisplayValue('Bruno Tavares (GOL)');
    expect(slot('Defesa')).toHaveDisplayValue('Felipe Moura (ZAG)');
    expect(slot('Meio 1')).toHaveDisplayValue('Sávio Lima (MEI)');
    expect(slot('Meio 2')).toHaveDisplayValue('Sem MEI disponível');
    expect(slot('Ataque')).toHaveDisplayValue('João Silva (ATA)');
    expect(
      screen.getByRole('button', { name: 'Salvar escalação' }),
    ).toBeDisabled();

    await userEvent.click(screen.getByRole('radio', { name: /^3-1/ }));

    expect(slot('Defesa 1')).toHaveDisplayValue('Felipe Moura (ZAG)');
    expect(slot('Defesa 2')).toHaveDisplayValue('Escolha o titular');
    expect(slot('Defesa 3')).toHaveDisplayValue('Escolha o titular');
    expect(
      screen.queryByRole('combobox', { name: /^Meio/ }),
    ).not.toBeInTheDocument();
  });

  it('salva com a formação e os 5 ids na ordem das vagas e avisa o sucesso', async () => {
    const lopes = rosterPlayer(10, 'Ari Lopes', 'LAT');
    const fetchMock = renderLineup({
      club: club([...ROSTER, lopes]),
      save: { body: { ...SAVED, formation: '3-1' } },
    });
    await waitForEditor();

    await userEvent.click(screen.getByRole('radio', { name: /^3-1/ }));
    expect(slot('Defesa 2')).toHaveDisplayValue('Diego Ramos (LAT)');
    await userEvent.selectOptions(slot('Defesa 3'), '10');
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar escalação' }),
    );

    expect(await screen.findByText('Escalação salva')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Águias FC na 3-1, com os 5 titulares devolvidos pela API.',
      ),
    ).toBeInTheDocument();
    expect(sentChanges(fetchMock)).toEqual([
      {
        method: 'PUT',
        path: '/clubs/1/lineup',
        body: { formation: '3-1', player_ids: [8, 3, 4, 10, 9] },
      },
    ]);
  });

  it('com as 5 vagas preenchidas, envia os 5 ids e mostra a escalação devolvida pela API', async () => {
    const fetchMock = renderLineup({
      lineup: { body: NONE },
      save: { body: SAVED },
    });
    await waitForEditor();

    await userEvent.selectOptions(slot('Ataque'), '9');
    await userEvent.selectOptions(slot('Meio'), '5');
    await userEvent.selectOptions(slot('Goleiro'), '8');
    await userEvent.selectOptions(slot('Defesa 2'), '4');
    expect(
      screen.getByRole('button', { name: 'Salvar escalação' }),
    ).toBeDisabled();
    await userEvent.selectOptions(slot('Defesa 1'), '3');
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar escalação' }),
    );

    expect(await screen.findByText('Completa')).toBeInTheDocument();
    expect(sentChanges(fetchMock)[0].body).toEqual({
      formation: '2-1-1',
      player_ids: [8, 3, 4, 5, 9],
    });
    expect(screen.queryByText(/Escalação incompleta/)).not.toBeInTheDocument();
  });

  it('recusa: mostra o message, rebusca o elenco e a escalação e volta para a salva', async () => {
    const reis = rosterPlayer(11, 'Caio Reis', 'MEI');
    const fetchMock = renderLineup({
      club: club([...ROSTER, reis]),
      save: {
        status: 409,
        body: { message: 'Caio Reis não é do elenco do Águias FC.' },
      },
    });
    await waitForEditor();
    const lineupBefore = lineupGets(fetchMock);
    const clubBefore = clubGets(fetchMock);

    await userEvent.selectOptions(slot('Meio'), '11');
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar escalação' }),
    );

    expect(
      await screen.findByText('A escalação foi recusada'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Caio Reis não é do elenco do Águias FC.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(lineupGets(fetchMock)).toBe(lineupBefore + 1));
    expect(clubGets(fetchMock)).toBe(clubBefore + 1);
    expect(slot('Meio')).toHaveDisplayValue('Sávio Lima (MEI)');
  });

  it('recusa com a escalação mudada na API: a tela passa a mostrar a nova', async () => {
    let current = SAVED;
    renderLineup({
      lineup: () => ({ body: current }),
      save: {
        status: 409,
        body: { message: 'Felipe Moura não é do elenco do Águias FC.' },
      },
    });
    await waitForEditor();
    current = {
      ...SAVED,
      complete: false,
      players: [TAVARES, RAMOS, LIMA, SILVA],
    };

    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar escalação' }),
    );

    expect(
      await screen.findByText('Felipe Moura não é do elenco do Águias FC.'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(slot('Defesa 1')).toHaveDisplayValue('Diego Ramos (LAT)'),
    );
    expect(screen.getByText('Incompleta')).toBeInTheDocument();
  });

  it('sem conexão: avisa, mantém as escolhas e salva na nova tentativa', async () => {
    let fail = true;
    const fetchMock = mockApiWith((url, init) => {
      const path = apiPath(url);
      if (path === '/clubs/1/lineup') {
        if (init.method === 'PUT') {
          return fail ? { networkError: true } : { body: SAVED };
        }
        return { body: SAVED };
      }
      if (path === '/clubs/1/transactions') {
        return { body: EMPTY_HISTORY };
      }
      return path === '/clubs/1' ? { body: club() } : undefined;
    });
    renderRoutes(
      [{ path: '/clubes/:id', element: <ClubPage /> }],
      '/clubes/1?tab=escalacao',
    );
    await waitForEditor();

    await userEvent.click(screen.getByRole('radio', { name: /^2-2/ }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar escalação' }),
    );
    await userEvent.click(screen.getByRole('radio', { name: /^2-1-1/ }));
    await userEvent.selectOptions(slot('Meio'), '5');
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar escalação' }),
    );

    expect(await screen.findByText('Sem conexão')).toBeInTheDocument();
    expect(slot('Meio')).toHaveDisplayValue('Sávio Lima (MEI)');

    fail = false;
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar escalação' }),
    );

    expect(await screen.findByText('Escalação salva')).toBeInTheDocument();
    expect(screen.queryByText('Sem conexão')).not.toBeInTheDocument();
    expect(sentChanges(fetchMock)).toHaveLength(2);
  });

  it('trava os botões enquanto envia e manda um só pedido no clique duplo', async () => {
    const fetchMock = renderLineup({ save: { body: SAVED, delayMs: 200 } });
    await waitForEditor();

    await userEvent.dblClick(
      screen.getByRole('button', { name: 'Salvar escalação' }),
    );

    expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(slot('Goleiro')).toBeDisabled();
    expect(await screen.findByText('Escalação salva')).toBeInTheDocument();
    expect(sentChanges(fetchMock)).toHaveLength(1);
  });

  it('Cancelar volta para a escalação salva, sem enviar nada', async () => {
    const fetchMock = renderLineup();
    await waitForEditor();

    await userEvent.click(screen.getByRole('radio', { name: /^2-2/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByRole('radio', { name: /^2-1-1/ })).toBeChecked();
    expect(slot('Meio')).toHaveDisplayValue('Sávio Lima (MEI)');
    expect(sentChanges(fetchMock)).toEqual([]);
  });

  it('mostra o carregamento e o erro da escalação, com nova tentativa', async () => {
    let fail = true;
    renderLineup({
      lineup: () =>
        fail
          ? { status: 500, body: { message: 'Erro interno.' } }
          : { body: SAVED },
    });

    expect(await screen.findByText('Carregando…')).toBeInTheDocument();
    expect(
      await screen.findByText('Não foi possível carregar a escalação'),
    ).toBeInTheDocument();
    expect(screen.getByText('Erro interno.')).toBeInTheDocument();

    fail = false;
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar de novo' }),
    );

    expect(await waitForEditor()).toBeInTheDocument();
  });

  it('o campo mostra os titulares escolhidos e as vagas vazias', async () => {
    renderLineup();
    await waitForEditor();

    const pitch = screen.getByRole('img', {
      name: 'Prévia da formação no campo',
    });
    expect(within(pitch).getByText('Tavares')).toBeInTheDocument();
    expect(within(pitch).getByText('Silva')).toBeInTheDocument();
    expect(within(pitch).getAllByTitle('Mal condicionado')).toHaveLength(2);
    expect(
      screen.getByText('Prévia da formação 2-1-1, do goleiro ao ataque.'),
    ).toBeInTheDocument();

    await userEvent.selectOptions(slot('Ataque'), '');

    expect(within(pitch).queryByText('Silva')).not.toBeInTheDocument();
    expect(within(pitch).getByText('Ataque')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Prévia da formação 2-1-1; as vagas vazias ficam tracejadas.',
      ),
    ).toBeInTheDocument();
  });
});
