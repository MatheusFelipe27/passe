import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { AppLayout } from './app-layout';

const STORAGE_KEY = 'passe:sidebar-collapsed';

function renderLayout(initialPath = '/') {
  mockApi({
    '/players?limit=1': {
      body: {
        data: [],
        meta: { page: 1, limit: 1, total_items: 6, total_pages: 6 },
      },
    },
    '/clubs': {
      body: [
        {
          id: 1,
          name: 'Águias FC',
          acronym: 'AGU',
          cash: 300,
          squad_value: 0,
          net_worth: 300,
        },
      ],
    },
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
