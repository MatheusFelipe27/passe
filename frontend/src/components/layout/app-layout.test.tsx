import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { AppLayout } from './app-layout';

const STORAGE_KEY = 'passe:sidebar-collapsed';

const AGUIAS = {
  id: 1,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 300,
  squad_value: 0,
  net_worth: 300,
};

function renderLayout(initialPath = '/', clubs = [AGUIAS]) {
  mockApi({
    '/players?limit=1': {
      body: {
        data: [],
        meta: { page: 1, limit: 1, total_items: 6, total_pages: 6 },
      },
    },
    '/clubs': { body: clubs },
    '/matches': { body: [] },
  });
  return renderRoutes([{ path: '*', element: <AppLayout /> }], initialPath);
}

describe('AppLayout', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('começa com a barra lateral aberta, com os nomes e as contagens', async () => {
    renderLayout();

    expect(await screen.findByText('Águias FC')).toBeInTheDocument();
    expect(screen.getByText('Jogadores')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Recolher menu' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('recolhe a barra deixando só os ícones, com o nome acessível', async () => {
    renderLayout();
    await screen.findByText('Águias FC');

    await userEvent.click(
      screen.getByRole('button', { name: 'Recolher menu' }),
    );

    expect(screen.queryByText('Jogadores')).not.toBeInTheDocument();
    expect(screen.queryByText('Águias FC')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jogadores' })).toHaveClass(
      'flex',
      'items-center',
      'justify-center',
    );
    expect(screen.getByRole('link', { name: 'Águias FC' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Expandir menu' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('mostra o nome do item num balão na barra recolhida', async () => {
    renderLayout();
    await screen.findByText('Águias FC');
    await userEvent.click(
      screen.getByRole('button', { name: 'Recolher menu' }),
    );

    await userEvent.hover(screen.getByRole('link', { name: 'Clubes' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Clubes');
  });

  it('marca o item da página atual', async () => {
    renderLayout('/jogadores');
    await screen.findByText('Águias FC');

    expect(screen.getByRole('link', { name: /Jogadores/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /Clubes/ })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marca o clube aberto, inclusive na barra recolhida', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');
    renderLayout('/clubes/1');

    expect(
      await screen.findByRole('link', { name: 'Águias FC' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('abre a criação de clube pelo "+" da lista de clubes', async () => {
    renderLayout();
    await screen.findByText('Águias FC');

    await userEvent.click(screen.getByRole('button', { name: 'Novo clube' }));

    expect(
      await screen.findByRole('dialog', { name: 'Novo clube' }),
    ).toBeInTheDocument();
  });

  it('avisa que ainda não há clubes, mantendo o "+"', async () => {
    renderLayout('/', []);

    expect(await screen.findByText('Nenhum clube ainda.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Novo clube' }),
    ).toBeInTheDocument();
  });

  it('esconde a lista de clubes vazia na barra recolhida', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');
    renderLayout('/', []);
    await screen.findByRole('link', { name: 'Clubes' });

    expect(screen.queryByText('Nenhum clube ainda.')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Clubes' }),
    ).not.toBeInTheDocument();
  });

  describe('com os 20 clubes da liga', () => {
    const TWENTY_CLUBS = Array.from({ length: 20 }, (_, index) => ({
      ...AGUIAS,
      id: index + 1,
      name: `Clube ${String(index + 1).padStart(2, '0')}`,
      acronym: 'CLU',
    }));

    it('rola só a lista de clubes, mantendo o resto da barra no lugar', async () => {
      renderLayout('/', TWENTY_CLUBS);
      const clubLink = await screen.findByRole('link', { name: 'Clube 20' });

      const list = clubLink.parentElement!;
      expect(list).toHaveClass('min-h-0', 'overflow-y-auto');
      expect(within(list).getAllByRole('link')).toHaveLength(20);
      expect(screen.getByRole('navigation', { name: 'Clubes' })).toHaveClass(
        'min-h-0',
        'flex-1',
      );
      expect(
        within(screen.getByRole('navigation', { name: 'Mercado' }))
          .getByRole('link', { name: /Jogadores/ })
          .closest('.overflow-y-auto'),
      ).toBeNull();
      expect(screen.getByText('Liga Fictícia 2026')).toBeInTheDocument();
    });

    it('traz o clube aberto para a área visível da lista', async () => {
      const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
      renderLayout('/clubes/20', TWENTY_CLUBS);

      const active = await screen.findByRole('link', { name: 'Clube 20' });

      expect(active).toHaveAttribute('aria-current', 'page');
      expect(
        scrollIntoView.mock.contexts.filter((element) => element === active),
      ).not.toHaveLength(0);
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
      scrollIntoView.mockRestore();
    });

    it('não mexe na rolagem quando nenhum clube está aberto', async () => {
      const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
      renderLayout('/jogadores', TWENTY_CLUBS);
      await screen.findByRole('link', { name: 'Clube 20' });

      const clubLinks = scrollIntoView.mock.contexts.filter((element) =>
        (element as Element).getAttribute('href')?.startsWith('/clubes/'),
      );
      expect(clubLinks).toHaveLength(0);
      scrollIntoView.mockRestore();
    });
  });

  it('guarda a escolha no navegador', async () => {
    renderLayout();
    await screen.findByText('Águias FC');

    await userEvent.click(
      screen.getByRole('button', { name: 'Recolher menu' }),
    );
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true');

    await userEvent.click(
      screen.getByRole('button', { name: 'Expandir menu' }),
    );
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('abre já recolhida quando essa foi a última escolha', () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');

    renderLayout();

    expect(
      screen.getByRole('button', { name: 'Expandir menu' }),
    ).toBeInTheDocument();
  });

  it('continua funcionando quando o navegador bloqueia o armazenamento', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });

    renderLayout();
    await userEvent.click(
      screen.getByRole('button', { name: 'Recolher menu' }),
    );

    expect(
      screen.getByRole('button', { name: 'Expandir menu' }),
    ).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
