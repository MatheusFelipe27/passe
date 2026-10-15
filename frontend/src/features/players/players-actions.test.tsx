import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Player } from '@/api/players';
import {
  apiPath,
  mockApiWith,
  sentChanges,
  type MockResponse,
} from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { PlayersPage } from './players-page';

const FREE_PLAYER: Player = {
  id: 3,
  name: 'Ênio Carvalho',
  position: 'LAT',
  agility: 83,
  age: 18,
  condition: 'DOENTE',
  base_value: 33.88,
  market_value: 32.19,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
  overall: 69,
  club_id: null,
};

const CLUB_PLAYER: Player = {
  ...FREE_PLAYER,
  id: 4,
  name: 'Danilo Freitas',
  position: 'ZAG',
  agility: 25,
  age: 30,
  condition: 'MAL_CONDICIONADO',
  club_id: 1,
};

const CREATED: Player = {
  ...FREE_PLAYER,
  id: 9,
  name: 'Davi Melo',
  position: 'MEI',
  agility: 70,
  age: 23,
  condition: 'APTO',
  base_value: 26,
  market_value: 26,
  overall: 68,
};

type Changes = Record<string, MockResponse>;

// Simula a API: a lista devolve os dois jogadores, e cada alteração responde como indicado.
function renderPlayers(changes: Changes = {}) {
  const fetchMock = mockApiWith((url, init) => {
    const method = init.method ?? 'GET';
    const path = apiPath(url);
    if (method !== 'GET') {
      return changes[`${method} ${path}`];
    }
    if (path === '/players') {
      const players = [FREE_PLAYER, CLUB_PLAYER];
      return {
        body: {
          data: players,
          meta: { page: 1, limit: 10, total_items: 2, total_pages: 1 },
        },
      };
    }
    if (path === '/players/3') {
      return { body: FREE_PLAYER };
    }
    return undefined;
  });
  renderRoutes(
    [{ path: '/jogadores', element: <PlayersPage /> }],
    '/jogadores',
  );
  return fetchMock;
}

async function openRowAction(playerName: string, action: string | RegExp) {
  await userEvent.click(
    await screen.findByRole('button', { name: `Ações de ${playerName}` }),
  );
  await userEvent.click(await screen.findByRole('menuitem', { name: action }));
}

async function fillNewPlayer(values: Record<string, string>) {
  for (const [label, value] of Object.entries(values)) {
    await userEvent.type(screen.getByLabelText(label), value);
  }
}

const VALID_NEW_PLAYER = {
  Nome: 'Davi Melo',
  Idade: '23',
  Agilidade: '70',
  Velocidade: '66',
  Finalização: '62',
  Passe: '74',
  Drible: '70',
  Defesa: '48',
  Físico: '58',
  Potencial: '82',
};

describe('ações da tela de jogadores', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('cadastro', () => {
    it('valida antes de enviar e não manda nada com campos vazios', async () => {
      const fetchMock = renderPlayers();
      await userEvent.click(
        await screen.findByRole('button', { name: /Novo jogador/ }),
      );

      await userEvent.click(
        screen.getByRole('button', { name: 'Salvar jogador' }),
      );

      expect(await screen.findByText('Informe o nome.')).toBeInTheDocument();
      expect(screen.getByText('Escolha a posição.')).toBeInTheDocument();
      expect(screen.getByText('Informe a idade.')).toBeInTheDocument();
      expect(screen.getByText('Informe o potencial.')).toBeInTheDocument();
      expect(
        screen.getByText('Corrija os campos destacados para salvar.'),
      ).toBeInTheDocument();
      expect(sentChanges(fetchMock)).toEqual([]);
    });

    it('mostra a mensagem junto ao campo fora do limite', async () => {
      renderPlayers();
      await userEvent.click(
        await screen.findByRole('button', { name: /Novo jogador/ }),
      );
      await fillNewPlayer({ ...VALID_NEW_PLAYER, Idade: '15', Passe: '120' });

      await userEvent.click(
        screen.getByRole('button', { name: 'Salvar jogador' }),
      );

      expect(
        await screen.findByText('Use uma idade de 16 a 45 anos.'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Idade')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(screen.getByText('Use um valor de 1 a 99.')).toBeInTheDocument();
    });

    it('envia os números e mostra os valores calculados pela API', async () => {
      const fetchMock = renderPlayers({
        'POST /players': { status: 201, body: CREATED },
      });
      await userEvent.click(
        await screen.findByRole('button', { name: /Novo jogador/ }),
      );
      await fillNewPlayer(VALID_NEW_PLAYER);
      await userEvent.click(screen.getByRole('radio', { name: /MEI/ }));

      await userEvent.click(
        screen.getByRole('button', { name: 'Salvar jogador' }),
      );

      const result = await screen.findByRole('dialog', {
        name: 'Jogador cadastrado',
      });
      expect(within(result).getAllByText('26,00')).toHaveLength(2);
      expect(within(result).getByText('68')).toBeInTheDocument();
      expect(sentChanges(fetchMock)).toEqual([
        {
          method: 'POST',
          path: '/players',
          body: {
            name: 'Davi Melo',
            position: 'MEI',
            age: 23,
            agility: 70,
            pace: 66,
            shooting: 62,
            passing: 74,
            dribbling: 70,
            defending: 48,
            physical: 58,
            potential: 82,
          },
        },
      ]);
    });

    it('põe a recusa da API junto ao campo e mostra o message', async () => {
      renderPlayers({
        'POST /players': {
          status: 400,
          body: {
            message:
              'potential: não pode ser menor que o maior dos seis atributos',
          },
        },
      });
      await userEvent.click(
        await screen.findByRole('button', { name: /Novo jogador/ }),
      );
      await fillNewPlayer(VALID_NEW_PLAYER);
      await userEvent.click(screen.getByRole('radio', { name: /MEI/ }));

      await userEvent.click(
        screen.getByRole('button', { name: 'Salvar jogador' }),
      );

      expect(
        await screen.findByText(
          'Não pode ser menor que o maior dos seis atributos.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Potencial')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(
        screen.getByText(
          'potential: não pode ser menor que o maior dos seis atributos',
        ),
      ).toBeInTheDocument();
    });

    it('envia um só pedido no clique duplo', async () => {
      const fetchMock = renderPlayers({
        'POST /players': { status: 201, body: CREATED, delayMs: 100 },
      });
      await userEvent.click(
        await screen.findByRole('button', { name: /Novo jogador/ }),
      );
      await fillNewPlayer(VALID_NEW_PLAYER);
      await userEvent.click(screen.getByRole('radio', { name: /MEI/ }));

      await userEvent.dblClick(
        screen.getByRole('button', { name: 'Salvar jogador' }),
      );

      await screen.findByRole('dialog', { name: 'Jogador cadastrado' });
      expect(sentChanges(fetchMock)).toHaveLength(1);
    });
  });

  describe('edição', () => {
    it('trava a posição de jogador com clube e a idade menor que a atual', async () => {
      const fetchMock = renderPlayers();
      await openRowAction('Danilo Freitas', 'Editar');

      expect(screen.getByRole('radio', { name: /ATA/ })).toBeDisabled();
      expect(screen.getByRole('radio', { name: /ZAG/ })).toBeEnabled();
      await userEvent.clear(screen.getByLabelText('Idade'));
      await userEvent.type(screen.getByLabelText('Idade'), '29');
      await userEvent.click(
        screen.getByRole('button', { name: 'Salvar alterações' }),
      );

      expect(
        await screen.findByText('A idade não pode ser menor que a atual (30).'),
      ).toBeInTheDocument();
      expect(sentChanges(fetchMock)).toEqual([]);
    });

    it('envia os quatro campos e avisa o sucesso', async () => {
      const fetchMock = renderPlayers({
        'PUT /players/4': { body: { ...CLUB_PLAYER, age: 31 } },
      });
      await openRowAction('Danilo Freitas', 'Editar');
      await userEvent.clear(screen.getByLabelText('Idade'));
      await userEvent.type(screen.getByLabelText('Idade'), '31');

      await userEvent.click(
        screen.getByRole('button', { name: 'Salvar alterações' }),
      );

      expect(await screen.findByText('Jogador atualizado')).toBeInTheDocument();
      expect(sentChanges(fetchMock)).toEqual([
        {
          method: 'PUT',
          path: '/players/4',
          body: {
            name: 'Danilo Freitas',
            position: 'ZAG',
            age: 31,
            agility: 25,
          },
        },
      ]);
    });

    it('mostra o message quando a API recusa', async () => {
      renderPlayers({
        'PUT /players/4': {
          status: 409,
          body: { message: 'Jogador com clube não pode mudar de posição.' },
        },
      });
      await openRowAction('Danilo Freitas', 'Editar');

      await userEvent.click(
        screen.getByRole('button', { name: 'Salvar alterações' }),
      );

      expect(
        await screen.findByText('Jogador com clube não pode mudar de posição.'),
      ).toBeInTheDocument();
    });
  });

  describe('alteração de condição', () => {
    it('impede de DOENTE direto para APTO', async () => {
      renderPlayers();
      await openRowAction('Ênio Carvalho', 'Alterar condição');

      expect(screen.getByRole('radio', { name: /Apto/ })).toBeDisabled();
      expect(
        screen.getByText('De Doente não passa direto para Apto.'),
      ).toBeInTheDocument();
    });

    it('envia a nova condição e mostra o valor de mercado devolvido', async () => {
      const fetchMock = renderPlayers({
        'PATCH /players/3/condition': {
          body: {
            ...FREE_PLAYER,
            condition: 'MAL_CONDICIONADO',
            market_value: 34.73,
          },
        },
      });
      await openRowAction('Ênio Carvalho', 'Alterar condição');
      await userEvent.click(
        screen.getByRole('radio', { name: /Mal condicionado/ }),
      );

      await userEvent.click(
        screen.getByRole('button', { name: 'Salvar condição' }),
      );

      expect(
        await screen.findByText(
          'Ênio Carvalho agora está mal condicionado. Valor de mercado: 34,73.',
        ),
      ).toBeInTheDocument();
      expect(sentChanges(fetchMock)).toEqual([
        {
          method: 'PATCH',
          path: '/players/3/condition',
          body: { condition: 'MAL_CONDICIONADO' },
        },
      ]);
    });

    it('mostra o message quando a API recusa', async () => {
      renderPlayers({
        'PATCH /players/3/condition': {
          status: 404,
          body: { message: 'Jogador não encontrado.' },
        },
      });
      await openRowAction('Ênio Carvalho', 'Alterar condição');

      await userEvent.click(
        screen.getByRole('button', { name: 'Salvar condição' }),
      );

      expect(
        await screen.findByText('Jogador não encontrado.'),
      ).toBeInTheDocument();
    });

    it('envia um só pedido no clique duplo', async () => {
      const fetchMock = renderPlayers({
        'PATCH /players/3/condition': { body: FREE_PLAYER, delayMs: 100 },
      });
      await openRowAction('Ênio Carvalho', 'Alterar condição');

      await userEvent.dblClick(
        screen.getByRole('button', { name: 'Salvar condição' }),
      );

      await screen.findByText('Condição alterada');
      expect(sentChanges(fetchMock)).toHaveLength(1);
    });
  });

  describe('exclusão', () => {
    it('só oferece Excluir para jogador livre', async () => {
      renderPlayers();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Ações de Danilo Freitas' }),
      );

      expect(
        screen.queryByRole('menuitem', { name: /Excluir/ }),
      ).not.toBeInTheDocument();
    });

    it('pede confirmação, exclui e avisa', async () => {
      const fetchMock = renderPlayers({
        'DELETE /players/3': { status: 204 },
      });
      await openRowAction('Ênio Carvalho', /Excluir/);

      const dialog = await screen.findByRole('dialog', {
        name: 'Excluir Ênio Carvalho?',
      });
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Excluir jogador' }),
      );

      expect(await screen.findByText('Jogador excluído')).toBeInTheDocument();
      expect(sentChanges(fetchMock)).toEqual([
        { method: 'DELETE', path: '/players/3', body: undefined },
      ]);
    });

    it('mostra o message quando a API recusa', async () => {
      renderPlayers({
        'DELETE /players/3': {
          status: 409,
          body: { message: 'Jogador com clube não pode ser excluído.' },
        },
      });
      await openRowAction('Ênio Carvalho', /Excluir/);

      await userEvent.click(
        await screen.findByRole('button', { name: 'Excluir jogador' }),
      );

      expect(
        await screen.findByText('Jogador com clube não pode ser excluído.'),
      ).toBeInTheDocument();
    });

    it('envia um só pedido no clique duplo', async () => {
      const fetchMock = renderPlayers({
        'DELETE /players/3': { status: 204, delayMs: 100 },
      });
      await openRowAction('Ênio Carvalho', /Excluir/);

      await userEvent.dblClick(
        await screen.findByRole('button', { name: 'Excluir jogador' }),
      );

      await screen.findByText('Jogador excluído');
      expect(sentChanges(fetchMock)).toHaveLength(1);
    });
  });

  it('atualiza a lista pela API depois de uma ação', async () => {
    const fetchMock = renderPlayers({ 'DELETE /players/3': { status: 204 } });
    await screen.findByText('Ênio Carvalho');
    const listCalls = () =>
      fetchMock.mock.calls.filter(
        ([input]) =>
          String(input).includes('/players?') &&
          String(input).includes('limit=10'),
      ).length;
    const before = listCalls();

    await openRowAction('Ênio Carvalho', /Excluir/);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Excluir jogador' }),
    );

    await waitFor(() => expect(listCalls()).toBeGreaterThan(before));
  });

  it('rebusca os clubes depois de uma ação, porque o valor do jogador entra no patrimônio', async () => {
    const fetchMock = renderPlayers({
      'PATCH /players/3/condition': { body: FREE_PLAYER },
    });
    await screen.findByText('Ênio Carvalho');
    const clubCalls = () =>
      fetchMock.mock.calls.filter(([input]) =>
        new URL(String(input)).pathname.endsWith('/clubs'),
      ).length;
    const before = clubCalls();

    await openRowAction('Ênio Carvalho', 'Alterar condição');
    await userEvent.click(
      screen.getByRole('radio', { name: /Mal condicionado/ }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar condição' }),
    );

    await waitFor(() => expect(clubCalls()).toBeGreaterThan(before));
  });

  it('abre os detalhes com os dados de GET /players/{id}', async () => {
    renderPlayers();
    await openRowAction('Ênio Carvalho', 'Ver detalhes');

    const sheet = await screen.findByRole('dialog', { name: 'Ênio Carvalho' });
    expect(await within(sheet).findByText('32,19')).toBeInTheDocument();
    expect(within(sheet).getByText('33,88')).toBeInTheDocument();
    expect(within(sheet).getByText('18 anos')).toBeInTheDocument();
  });
});
