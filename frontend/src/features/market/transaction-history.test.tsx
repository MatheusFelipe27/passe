import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClubDetail } from '@/api/clubs';
import type { Transaction, TransactionHistory } from '@/api/market';
import {
  apiPath,
  mockApiWith,
  requestedUrls,
  type MockResponse,
} from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { ClubPage } from '@/features/clubs/club-page';

const CLUB: ClubDetail = {
  id: 1,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 51.58,
  squad_value: 0,
  net_worth: 51.58,
  players: [],
};

function transaction(fields: Partial<Transaction>): Transaction {
  return {
    id: 1,
    club_id: 1,
    player_id: 2,
    player_name: 'Meia Lua',
    type: 'COMPRA',
    value: 37,
    fee: 1.85,
    penalty: 0,
    profit: null,
    cash_change: -38.85,
    created_at: '2026-11-02T10:15:00-03:00',
    ...fields,
  };
}

const LOSS = transaction({
  id: 4,
  player_id: 7,
  player_name: 'Renan Castro',
  type: 'VENDA',
  value: 32.3,
  fee: 0,
  penalty: 6.46,
  profit: -5.7,
  cash_change: 25.84,
  created_at: '2026-11-06T08:30:00-03:00',
});
const SALE = transaction({
  id: 3,
  type: 'VENDA',
  value: 40,
  fee: 0.3,
  penalty: 4,
  profit: 3,
  cash_change: 35.7,
  created_at: '2026-11-05T16:40:00-03:00',
});
const RENAN_PURCHASE = transaction({
  id: 2,
  player_id: 7,
  player_name: 'Renan Castro',
  value: 38,
  fee: 1.9,
  cash_change: -39.9,
  created_at: '2026-11-02T14:00:00-03:00',
});
const PURCHASE = transaction({});

const ALL: TransactionHistory = {
  data: [LOSS, SALE, RENAN_PURCHASE, PURCHASE],
  summary: {
    total_spent: 78.75,
    total_received: 61.54,
    total_fees: 4.05,
    total_penalties: 10.46,
    total_profit: -2.7,
  },
};

const SALES_ONLY: TransactionHistory = {
  data: [LOSS, SALE],
  summary: {
    total_spent: 0,
    total_received: 61.54,
    total_fees: 0.3,
    total_penalties: 10.46,
    total_profit: -2.7,
  },
};

const MEIA_LUA: TransactionHistory = {
  data: [SALE, PURCHASE],
  summary: {
    total_spent: 38.85,
    total_received: 35.7,
    total_fees: 2.15,
    total_penalties: 4,
    total_profit: 3,
  },
};

const EMPTY: TransactionHistory = {
  data: [],
  summary: {
    total_spent: 0,
    total_received: 0,
    total_fees: 0,
    total_penalties: 0,
    total_profit: 0,
  },
};

const CSV =
  'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n' +
  '2026-11-06T08:30:00-03:00;VENDA;Renan Castro;32,30;0,00;6,46;-5,70;25,84\n';

interface Api {
  histories?: Record<string, MockResponse | (() => MockResponse)>;
  csv?: MockResponse;
}

// O histórico responde conforme os query params pedidos; o CSV responde como indicado.
function renderHistory(
  { histories = {}, csv }: Api = {},
  path = '/clubes/1?tab=historico',
) {
  const fetchMock = mockApiWith((url) => {
    const requested = apiPath(url);
    if (requested === '/clubs/1') {
      return { body: CLUB };
    }
    if (requested === '/clubs/1/transactions') {
      const response = histories[url.search] ?? { body: ALL };
      return typeof response === 'function' ? response() : response;
    }
    if (requested === '/clubs/1/transactions/export') {
      return csv;
    }
    return undefined;
  });
  const rendered = renderRoutes(
    [{ path: '/clubes/:id', element: <ClubPage /> }],
    path,
  );
  return { fetchMock, ...rendered };
}

function historyRequests(fetchMock: ReturnType<typeof vi.fn>) {
  return requestedUrls(fetchMock)
    .filter((url) => apiPath(url) === '/clubs/1/transactions')
    .map((url) => url.search);
}

function panel() {
  return screen.getByRole('region', { name: 'Histórico de transações' });
}

function bodyRows() {
  return within(within(panel()).getByRole('table'))
    .getAllByRole('row')
    .slice(1);
}

function cellsOf(row: HTMLElement) {
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);
}

function summaryValues() {
  return within(panel())
    .getAllByRole('definition')
    .map((value) => value.textContent);
}

describe('histórico de transações na página do clube', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('aba e tabela', () => {
    it('abre a aba pelo clique e guarda a escolha na URL, com o total de transações', async () => {
      const { router } = renderHistory({}, '/clubes/1');

      const tab = await screen.findByRole('tab', { name: /Histórico/ });
      await waitFor(() => expect(tab).toHaveTextContent('Histórico4'));
      await userEvent.click(tab);

      expect(router.state.location.search).toBe('?tab=historico');
      expect(await within(panel()).findByRole('table')).toBeInTheDocument();
    });

    it('mostra cada coluna como a API devolveu, com os sinais da variação e do lucro', async () => {
      renderHistory();
      await within(
        await screen.findByRole('region', { name: 'Histórico de transações' }),
      ).findByRole('table');

      expect(bodyRows().map(cellsOf)).toEqual([
        [
          '06/11/202608:30',
          'Venda',
          'RCRenan Castro',
          '32,30',
          '0,00',
          '6,46',
          '−5,70',
          '+25,84',
        ],
        [
          '05/11/202616:40',
          'Venda',
          'MLMeia Lua',
          '40,00',
          '0,30',
          '4,00',
          '+3,00',
          '+35,70',
        ],
        [
          '02/11/202614:00',
          'Compra',
          'RCRenan Castro',
          '38,00',
          '1,90',
          '0,00',
          '–',
          '−39,90',
        ],
        [
          '02/11/202610:15',
          'Compra',
          'MLMeia Lua',
          '37,00',
          '1,85',
          '0,00',
          '–',
          '−38,85',
        ],
      ]);
      expect(within(panel()).getByText('+35,70')).toHaveClass('text-success');
      expect(within(panel()).getByText('−38,85')).toHaveClass(
        'text-destructive',
      );
      expect(within(panel()).getByText('+3,00')).toHaveClass('text-success');
      expect(within(bodyRows()[0]).getByText('−5,70')).toHaveClass(
        'text-destructive',
      );
    });

    it('mostra os cinco totais do summary e a conta do caixa', async () => {
      renderHistory();
      await within(
        await screen.findByRole('region', { name: 'Histórico de transações' }),
      ).findByRole('table');

      expect(summaryValues()).toEqual([
        '78,75',
        '61,54',
        '4,05',
        '10,46',
        '−2,70',
      ]);
      expect(panel()).toHaveTextContent(
        'Os totais respeitam os filtros. 300,00 + soma das variações = caixa atual (51,58).',
      );
    });

    it('mostra o lucro total positivo em verde e o zero sem cor', async () => {
      renderHistory({
        histories: {
          '': {
            body: { ...ALL, summary: { ...ALL.summary, total_profit: 3 } },
          },
          '?type=COMPRA': {
            body: {
              data: [PURCHASE],
              summary: { ...EMPTY.summary, total_profit: 0 },
            },
          },
        },
      });
      const profit = await within(
        await screen.findByRole('region', { name: 'Histórico de transações' }),
      ).findByText('+3,00', { selector: 'dd span' });
      expect(profit).toHaveClass('text-success');

      await userEvent.click(
        within(panel()).getByRole('checkbox', { name: 'Venda' }),
      );

      await waitFor(() => expect(summaryValues()[4]).toBe('0,00'));
      const zero =
        within(panel()).getAllByRole('definition')[4].firstElementChild;
      expect(zero).not.toHaveClass('text-success');
      expect(zero).not.toHaveClass('text-destructive');
    });
  });

  describe('filtros', () => {
    it('filtra por tipo, refaz os totais e não deixa desmarcar o último tipo', async () => {
      const { fetchMock, router } = renderHistory({
        histories: { '?type=VENDA': { body: SALES_ONLY } },
      });
      await within(
        await screen.findByRole('region', { name: 'Histórico de transações' }),
      ).findByRole('table');

      await userEvent.click(
        within(panel()).getByRole('checkbox', { name: 'Compra' }),
      );

      await waitFor(() => expect(bodyRows()).toHaveLength(2));
      expect(historyRequests(fetchMock)).toContain('?type=VENDA');
      expect(router.state.location.search).toBe('?tab=historico&type=VENDA');
      expect(summaryValues()[0]).toBe('0,00');
      expect(
        within(panel()).getByRole('checkbox', { name: 'Compra' }),
      ).not.toBeChecked();
      expect(
        within(panel()).getByRole('checkbox', { name: 'Venda' }),
      ).toBeDisabled();
    });

    it('volta a mostrar tudo ao marcar de novo o tipo ou ao limpar os filtros', async () => {
      const { router } = renderHistory(
        {
          histories: { '?type=COMPRA': { body: { ...ALL, data: [PURCHASE] } } },
        },
        '/clubes/1?tab=historico&type=COMPRA',
      );
      await within(
        await screen.findByRole('region', { name: 'Histórico de transações' }),
      ).findByRole('table');

      await userEvent.click(
        within(panel()).getByRole('checkbox', { name: 'Venda' }),
      );
      expect(router.state.location.search).toBe('?tab=historico');

      await userEvent.click(
        within(panel()).getByRole('checkbox', { name: 'Venda' }),
      );
      expect(router.state.location.search).toBe('?tab=historico&type=COMPRA');
      await userEvent.click(
        within(panel()).getByRole('button', { name: 'Limpar filtros' }),
      );
      expect(router.state.location.search).toBe('?tab=historico');
      expect(
        within(panel()).queryByRole('button', { name: 'Limpar filtros' }),
      ).not.toBeInTheDocument();
    });

    it('lista no filtro os jogadores do histórico, sem repetir, e filtra por um deles', async () => {
      const { fetchMock, router } = renderHistory({
        histories: { '?player_id=2': { body: MEIA_LUA } },
      });
      await within(
        await screen.findByRole('region', { name: 'Histórico de transações' }),
      ).findByRole('table');

      await userEvent.click(
        within(panel()).getByRole('button', { name: 'Jogador: todos' }),
      );
      const options = screen
        .getAllByRole('menuitemradio')
        .map((item) => item.textContent);
      expect(options).toEqual(['Todos', 'Meia Lua', 'Renan Castro']);
      await userEvent.click(
        screen.getByRole('menuitemradio', { name: 'Meia Lua' }),
      );

      await waitFor(() => expect(bodyRows()).toHaveLength(2));
      expect(historyRequests(fetchMock)).toContain('?player_id=2');
      expect(router.state.location.search).toBe('?tab=historico&player_id=2');
      expect(
        within(panel()).getByRole('button', { name: 'Jogador: Meia Lua' }),
      ).toBeInTheDocument();
      expect(summaryValues()).toEqual([
        '38,85',
        '35,70',
        '2,15',
        '4,00',
        '+3,00',
      ]);
    });

    it('combina os dois filtros no mesmo pedido', async () => {
      const { fetchMock } = renderHistory(
        {
          histories: {
            '?type=VENDA&player_id=2': { body: { ...MEIA_LUA, data: [SALE] } },
          },
        },
        '/clubes/1?tab=historico&type=VENDA&player_id=2',
      );

      await within(
        await screen.findByRole('region', { name: 'Histórico de transações' }),
      ).findByRole('table');

      expect(historyRequests(fetchMock)).toContain('?type=VENDA&player_id=2');
      expect(bodyRows()).toHaveLength(1);
    });

    it('ignora na URL um tipo ou jogador fora do formato', async () => {
      const { fetchMock } = renderHistory(
        {},
        '/clubes/1?tab=historico&type=compra&player_id=01',
      );

      await within(
        await screen.findByRole('region', { name: 'Histórico de transações' }),
      ).findByRole('table');

      expect(historyRequests(fetchMock).every((search) => search === '')).toBe(
        true,
      );
    });

    it('mostra a recusa do filtro com o message da API e esconde a tabela e os totais', async () => {
      renderHistory(
        {
          histories: {
            '?player_id=7': {
              status: 404,
              body: { message: 'Jogador não encontrado.' },
            },
          },
        },
        '/clubes/1?tab=historico&player_id=7',
      );

      const banner = await screen.findByText('O filtro foi recusado');

      expect(banner.closest('[data-slot="alert"]')).toHaveTextContent(
        'Jogador não encontrado.',
      );
      expect(within(panel()).queryByRole('table')).not.toBeInTheDocument();
      expect(within(panel()).queryAllByRole('definition')).toHaveLength(0);
      expect(
        within(panel()).getByRole('button', { name: 'Limpar filtros' }),
      ).toBeInTheDocument();
    });
  });

  describe('estados', () => {
    it('mostra o histórico vazio com os totais zerados', async () => {
      renderHistory({ histories: { '': { body: EMPTY } } });

      expect(
        await screen.findByText('Nenhuma transação ainda'),
      ).toBeInTheDocument();
      expect(summaryValues()).toEqual(['0,00', '0,00', '0,00', '0,00', '0,00']);
    });

    it('avisa quando os filtros não encontram nada', async () => {
      renderHistory(
        { histories: { '?type=COMPRA': { body: EMPTY } } },
        '/clubes/1?tab=historico&type=COMPRA',
      );

      expect(
        await screen.findByText('Nenhuma transação com esses filtros'),
      ).toBeInTheDocument();
    });

    it('mostra o carregamento enquanto a API não responde', async () => {
      renderHistory({ histories: { '': { body: ALL, delayMs: 1000 } } });

      expect(
        await within(
          await screen.findByRole('region', {
            name: 'Histórico de transações',
          }),
        ).findByText('Carregando…'),
      ).toBeInTheDocument();
    });

    it('mostra o erro com o message da API e tenta de novo', async () => {
      let calls = 0;
      renderHistory({
        histories: {
          '': () => {
            calls += 1;
            return calls === 1
              ? { status: 500, body: { message: 'Erro interno do servidor.' } }
              : { body: ALL };
          },
        },
      });

      expect(
        await screen.findByText('Não foi possível carregar o histórico'),
      ).toBeInTheDocument();
      expect(
        within(panel()).getByText('Erro interno do servidor.'),
      ).toBeInTheDocument();

      await userEvent.click(
        within(panel()).getByRole('button', { name: 'Tentar de novo' }),
      );

      expect(await within(panel()).findByRole('table')).toBeInTheDocument();
    });
  });

  describe('exportação CSV', () => {
    let savedBlobs: Blob[];
    let clickedNames: string[];

    beforeEach(() => {
      savedBlobs = [];
      clickedNames = [];
      // O jsdom não tem as funções de arquivo do navegador: o teste guarda o que seria baixado.
      URL.createObjectURL = (blob: Blob) => {
        savedBlobs.push(blob);
        return 'blob:csv';
      };
      URL.revokeObjectURL = () => undefined;
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
        function (this: HTMLAnchorElement) {
          clickedNames.push(this.download);
        },
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    const FILE: MockResponse = {
      text: CSV,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="transacoes-AGU.csv"',
      },
    };

    it('pede o CSV com os filtros aplicados e baixa o arquivo devolvido pela API', async () => {
      const { fetchMock } = renderHistory(
        { histories: { '?type=VENDA': { body: SALES_ONLY } }, csv: FILE },
        '/clubes/1?tab=historico&type=VENDA',
      );
      await within(
        await screen.findByRole('region', { name: 'Histórico de transações' }),
      ).findByRole('table');

      await userEvent.click(
        within(panel()).getByRole('button', { name: 'Exportar CSV' }),
      );

      expect(await screen.findByText('CSV baixado')).toBeInTheDocument();
      expect(
        screen.getByText(
          'transacoes-AGU.csv, com o filtro de tipo Venda aplicado.',
        ),
      ).toBeInTheDocument();
      const exportUrl = requestedUrls(fetchMock).find(
        (url) => apiPath(url) === '/clubs/1/transactions/export',
      );
      expect(exportUrl?.search).toBe('?type=VENDA');
      expect(clickedNames).toEqual(['transacoes-AGU.csv']);
      expect(await savedBlobs[0].text()).toBe(CSV);
    });

    it('descreve o CSV sem filtros e com o filtro de jogador', async () => {
      renderHistory(
        { histories: { '?player_id=2': { body: MEIA_LUA } }, csv: FILE },
        '/clubes/1?tab=historico&player_id=2',
      );
      await within(
        await screen.findByRole('region', { name: 'Histórico de transações' }),
      ).findByRole('table');

      await userEvent.click(
        within(panel()).getByRole('button', { name: 'Exportar CSV' }),
      );

      expect(
        await screen.findByText(
          'transacoes-AGU.csv, com o filtro de jogador Meia Lua aplicado.',
        ),
      ).toBeInTheDocument();
    });

    it('mostra o message da API quando ela recusa o CSV', async () => {
      renderHistory({
        csv: { status: 404, body: { message: 'Jogador não encontrado.' } },
      });
      await within(
        await screen.findByRole('region', { name: 'Histórico de transações' }),
      ).findByRole('table');

      await userEvent.click(
        within(panel()).getByRole('button', { name: 'Exportar CSV' }),
      );

      expect(
        await screen.findByText('Não foi possível exportar o CSV'),
      ).toBeInTheDocument();
      expect(screen.getByText('Jogador não encontrado.')).toBeInTheDocument();
      expect(clickedNames).toEqual([]);
    });

    it('baixa um arquivo só no clique duplo', async () => {
      const { fetchMock } = renderHistory({ csv: { ...FILE, delayMs: 200 } });
      await within(
        await screen.findByRole('region', { name: 'Histórico de transações' }),
      ).findByRole('table');

      await userEvent.dblClick(
        within(panel()).getByRole('button', { name: 'Exportar CSV' }),
      );

      await screen.findByText('CSV baixado');
      const exports = requestedUrls(fetchMock).filter(
        (url) => apiPath(url) === '/clubs/1/transactions/export',
      );
      expect(exports).toHaveLength(1);
      expect(clickedNames).toHaveLength(1);
    });
  });
});
