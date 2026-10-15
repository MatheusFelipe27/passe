import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Club } from '@/api/clubs';
import {
  apiPath,
  mockApiWith,
  requestedUrls,
  sentChanges,
  type MockResponse,
} from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { ClubsPage } from './clubs-page';
import { NewClubDialogProvider } from './new-club-dialog-provider';

function club(id: number, name: string, acronym: string, values: number[]) {
  const [cash, squadValue, netWorth] = values;
  return {
    id,
    name,
    acronym,
    cash,
    squad_value: squadValue,
    net_worth: netWorth,
  };
}

const EPSILON = club(2, 'Épsilon EC', 'EPS', [215.47, 80.5, 295.97]);
const TUBAROES = club(6, 'Tubarões EC', 'TUB', [300, 0, 300]);
const AGUIAS = club(1, 'Águias FC', 'AGU', [51.58, 222.68, 274.26]);

const CREATED = club(7, 'Leões da Serra', 'LDS', [300, 0, 300]);

interface Api {
  lists?: Record<string, MockResponse>;
  create?: MockResponse;
}

// A lista responde conforme o sort pedido; o POST responde como indicado.
function renderClubs({ lists = {}, create }: Api = {}, path = '/clubes') {
  const fetchMock = mockApiWith((url, init) => {
    if ((init.method ?? 'GET') === 'POST') {
      return create;
    }
    if (apiPath(url) === '/clubs') {
      return lists[url.search] ?? { body: [AGUIAS, EPSILON, TUBAROES] };
    }
    return undefined;
  });
  const rendered = renderRoutes(
    [
      {
        path: '/clubes',
        element: (
          <NewClubDialogProvider>
            <ClubsPage />
          </NewClubDialogProvider>
        ),
      },
      { path: '/clubes/:id', element: <ClubProbe /> },
    ],
    path,
  );
  return { fetchMock, ...rendered };
}

function ClubProbe() {
  const { id } = useParams();
  return <p>Página do clube {id}</p>;
}

function bodyRows() {
  return screen.getAllByRole('row').slice(1);
}

function clubNamesInTable() {
  return bodyRows().map(
    (row) => within(row).getAllByRole('cell')[0].textContent,
  );
}

async function openDialog() {
  await screen.findByRole('table');
  await userEvent.click(screen.getByRole('button', { name: 'Novo clube' }));
  return screen.findByRole('dialog', { name: 'Novo clube' });
}

async function fillAndSubmit(name: string, acronym: string) {
  const dialog = await openDialog();
  await userEvent.type(within(dialog).getByLabelText('Nome'), name);
  await userEvent.type(within(dialog).getByLabelText('Sigla'), acronym);
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Criar clube' }),
  );
  return dialog;
}

describe('ClubsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('lista', () => {
    it('mostra nome, sigla, caixa, valor do elenco e patrimônio em moedas', async () => {
      renderClubs();

      await screen.findByRole('table');
      const cells = within(bodyRows()[0])
        .getAllByRole('cell')
        .map((cell) => cell.textContent);
      expect(cells.slice(0, 5)).toEqual([
        'AGUÁguias FC',
        'AGU',
        '51,58',
        '222,68',
        '274,26',
      ]);
      expect(
        within(bodyRows()[0]).getByRole('link', {
          name: 'Ver clube Águias FC',
        }),
      ).toHaveAttribute('href', '/clubes/1');
    });

    it('mantém a ordem devolvida pela API, sem reordenar na tela', async () => {
      renderClubs({
        lists: { '': { body: [TUBAROES, AGUIAS, EPSILON] } },
      });

      await screen.findByRole('table');
      expect(clubNamesInTable()).toEqual([
        'TUBTubarões EC',
        'AGUÁguias FC',
        'EPSÉpsilon EC',
      ]);
    });

    it.each([
      [[AGUIAS], '1 clube', '1 de 20'],
      [[AGUIAS, EPSILON], '2 clubes', '2 de 20'],
      [
        Array.from({ length: 20 }, (_, index) =>
          club(index + 1, `Clube ${index}`, 'CLU', [300, 0, 300]),
        ),
        '20 clubes',
        '20 de 20',
      ],
    ])('conta os clubes (%#)', async (clubs: Club[], total, limit) => {
      renderClubs({ lists: { '': { body: clubs } } });

      expect(await screen.findByText(total)).toBeInTheDocument();
      expect(screen.getByText(limit)).toBeInTheDocument();
    });

    it('mostra o carregamento enquanto a API não responde', async () => {
      renderClubs({ lists: { '': { body: [], delayMs: 1000 } } });

      expect(await screen.findByText('Carregando…')).toBeInTheDocument();
    });

    it('mostra a lista vazia com o botão de criar e sem o cabeçalho da lista', async () => {
      renderClubs({ lists: { '': { body: [] } } });

      expect(
        await screen.findByText('Nenhum clube cadastrado'),
      ).toBeInTheDocument();
      expect(screen.queryByText(/de 20/)).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Ordenar/ }),
      ).not.toBeInTheDocument();

      const [, emptyButton] = screen.getAllByRole('button', {
        name: 'Novo clube',
      });
      await userEvent.click(emptyButton);
      expect(
        await screen.findByRole('dialog', { name: 'Novo clube' }),
      ).toBeInTheDocument();
    });

    it('mostra o erro com o message da API e tenta de novo', async () => {
      let calls = 0;
      const { fetchMock } = renderClubs({
        lists: {
          get ''() {
            calls += 1;
            return calls === 1
              ? { status: 500, body: { message: 'Erro interno do servidor.' } }
              : { body: [AGUIAS] };
          },
        },
      });

      expect(
        await screen.findByText('Não foi possível carregar os clubes'),
      ).toBeInTheDocument();
      expect(screen.getByText('Erro interno do servidor.')).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: 'Tentar de novo' }),
      );
      expect(await screen.findByText('Águias FC')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('ordenação', () => {
    it('pede à API a ordem por patrimônio e guarda a escolha na URL', async () => {
      const { fetchMock, router } = renderClubs({
        lists: {
          '?sort=net_worth_desc': { body: [TUBAROES, EPSILON, AGUIAS] },
        },
      });
      await screen.findByRole('table');

      await userEvent.click(
        screen.getByRole('button', { name: 'Ordenar: nome' }),
      );
      await userEvent.click(
        screen.getByRole('menuitemradio', {
          name: 'Patrimônio (maior para o menor)',
        }),
      );

      await waitFor(() =>
        expect(clubNamesInTable()).toEqual([
          'TUBTubarões EC',
          'EPSÉpsilon EC',
          'AGUÁguias FC',
        ]),
      );
      expect(router.state.location.search).toBe('?sort=net_worth_desc');
      expect(requestedUrls(fetchMock).at(-1)?.search).toBe(
        '?sort=net_worth_desc',
      );
      expect(
        screen.getByRole('button', {
          name: 'Ordenar: patrimônio (maior para o menor)',
        }),
      ).toBeInTheDocument();
    });

    it('lê a ordem da URL ao abrir a tela', async () => {
      const { fetchMock } = renderClubs(
        { lists: { '?sort=net_worth_asc': { body: [AGUIAS] } } },
        '/clubes?sort=net_worth_asc',
      );

      expect(
        await screen.findByRole('button', {
          name: 'Ordenar: patrimônio (menor para o maior)',
        }),
      ).toBeInTheDocument();
      expect(requestedUrls(fetchMock)[0].search).toBe('?sort=net_worth_asc');
    });

    it('volta para a ordem por nome sem o sort na URL nem no pedido', async () => {
      const { fetchMock, router } = renderClubs(
        {},
        '/clubes?sort=net_worth_desc',
      );
      await screen.findByRole('table');

      await userEvent.click(
        screen.getByRole('button', {
          name: 'Ordenar: patrimônio (maior para o menor)',
        }),
      );
      await userEvent.click(
        screen.getByRole('menuitemradio', { name: 'Nome' }),
      );

      await waitFor(() => expect(router.state.location.search).toBe(''));
      expect(requestedUrls(fetchMock).at(-1)?.search).toBe('');
    });

    it('ignora uma ordem desconhecida na URL e usa o nome', async () => {
      const { fetchMock } = renderClubs({}, '/clubes?sort=POSITION');

      expect(
        await screen.findByRole('button', { name: 'Ordenar: nome' }),
      ).toBeInTheDocument();
      expect(requestedUrls(fetchMock)[0].search).toBe('');
    });
  });

  describe('criação', () => {
    it('valida antes de enviar, com a mensagem junto ao campo', async () => {
      const { fetchMock } = renderClubs();
      const dialog = await openDialog();

      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Criar clube' }),
      );

      expect(await within(dialog).findByText('Informe o nome.')).toBeVisible();
      expect(within(dialog).getByText('Informe a sigla.')).toBeVisible();
      expect(within(dialog).getByLabelText('Nome')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(sentChanges(fetchMock)).toEqual([]);
    });

    it('passa a sigla para maiúsculas enquanto se digita', async () => {
      renderClubs();
      const dialog = await openDialog();

      await userEvent.type(within(dialog).getByLabelText('Sigla'), 'lds');

      expect(within(dialog).getByLabelText('Sigla')).toHaveValue('LDS');
    });

    it('cria o clube, avisa e abre a página dele', async () => {
      const { fetchMock, router } = renderClubs({
        create: { status: 201, body: CREATED },
      });

      await fillAndSubmit('Leões da Serra', 'lds');

      expect(await screen.findByText('Página do clube 7')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/clubes/7');
      expect(sentChanges(fetchMock)).toEqual([
        {
          method: 'POST',
          path: '/clubs',
          body: { name: 'Leões da Serra', acronym: 'LDS' },
        },
      ]);
      expect(await screen.findByText('Clube criado')).toBeInTheDocument();
      expect(
        screen.getByText('Leões da Serra (LDS) começa com 300,00 em caixa.'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it.each([
      [
        'nome repetido',
        'name: já existe um clube com o nome águias fc',
        'Já existe um clube com o nome águias fc.',
        'Nome',
      ],
      [
        'sigla repetida',
        'acronym: já existe um clube com a sigla AGF',
        'Já existe um clube com a sigla AGF.',
        'Sigla',
      ],
      [
        'limite de clubes',
        'A liga já tem 20 clubes, o máximo permitido.',
        'A liga já tem 20 clubes, o máximo permitido.',
        undefined,
      ],
    ])(
      'mostra a recusa da API (%s) na faixa e destaca o campo dela, sem sair da janela',
      async (_, apiMessage, shown, invalidField) => {
        const { router } = renderClubs({
          create: { status: 409, body: { message: apiMessage } },
        });

        const dialog = await fillAndSubmit('águias fc', 'AGF');

        const banner = await within(dialog).findByText(
          'Não foi possível criar o clube',
        );
        expect(banner.closest('[data-slot="alert"]')).toHaveTextContent(shown);
        for (const field of ['Nome', 'Sigla']) {
          expect(within(dialog).getByLabelText(field)).toHaveAttribute(
            'aria-invalid',
            String(field === invalidField),
          );
        }
        expect(within(dialog).getAllByText(shown)).toHaveLength(
          invalidField ? 2 : 1,
        );
        expect(within(dialog).getByLabelText('Nome')).toHaveValue('águias fc');
        expect(router.state.location.pathname).toBe('/clubes');
      },
    );

    it('marca o campo que a API recusou com 400', async () => {
      renderClubs({
        create: {
          status: 400,
          body: {
            message:
              'acronym: as letras devem aparecer no nome, nessa ordem, começando pela primeira letra do nome',
          },
        },
      });

      const dialog = await fillAndSubmit('Tubarões EC', 'UBA');

      const message =
        'As letras devem aparecer no nome, nessa ordem, começando pela primeira letra do nome.';
      await waitFor(() =>
        expect(within(dialog).getAllByText(message)).toHaveLength(2),
      );
      expect(within(dialog).getByLabelText('Sigla')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(within(dialog).getByLabelText('Nome')).toHaveAttribute(
        'aria-invalid',
        'false',
      );
    });

    it('envia um só pedido no clique duplo', async () => {
      const { fetchMock } = renderClubs({
        create: { status: 201, body: CREATED, delayMs: 50 },
      });
      const dialog = await openDialog();
      await userEvent.type(
        within(dialog).getByLabelText('Nome'),
        'Leões da Serra',
      );
      await userEvent.type(within(dialog).getByLabelText('Sigla'), 'LDS');

      await userEvent.dblClick(
        within(dialog).getByRole('button', { name: 'Criar clube' }),
      );

      expect(await screen.findByText('Página do clube 7')).toBeInTheDocument();
      expect(sentChanges(fetchMock)).toHaveLength(1);
    });

    it('limpa o formulário e a recusa ao cancelar', async () => {
      renderClubs({
        create: {
          status: 409,
          body: { message: 'name: já existe um clube com o nome Águias FC' },
        },
      });
      const dialog = await fillAndSubmit('Águias FC', 'AGU');
      await within(dialog).findByText('Não foi possível criar o clube');
      expect(within(dialog).getByLabelText('Nome')).toHaveAttribute(
        'aria-invalid',
        'true',
      );

      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Cancelar' }),
      );
      const reopened = await openDialog();

      expect(within(reopened).getByLabelText('Nome')).toHaveValue('');
      expect(within(reopened).getByLabelText('Nome')).toHaveAttribute(
        'aria-invalid',
        'false',
      );
      expect(within(reopened).getByLabelText('Sigla')).toHaveValue('');
      expect(within(reopened).queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
