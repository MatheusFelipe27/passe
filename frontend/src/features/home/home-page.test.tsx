import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi, type MockResponse } from '@/test/fetch-mock';
import { renderRoutes } from '@/test/render';
import { HomePage } from './home-page';

const PLAYERS_PAGE = (total: number) => ({
  body: {
    data: [],
    meta: { page: 1, limit: 1, total_items: total, total_pages: total },
  },
});

const STANDING = (club_name: string, played: number, points: number) => ({
  position: 1,
  club_id: 1,
  club_name,
  played,
  wins: 0,
  draws: 0,
  losses: 0,
  goals_for: 0,
  goals_against: 0,
  goal_difference: 0,
  points,
});

function renderHome(responses: Record<string, MockResponse>) {
  mockApi({
    '/players?limit=1': PLAYERS_PAGE(23),
    '/players?limit=1&free=true': PLAYERS_PAGE(7),
    '/clubs': { body: Array.from({ length: 6 }, (_, id) => ({ id })) },
    '/matches': { body: [{ id: 1 }, { id: 2 }] },
    '/standings': { body: [STANDING('Delta FC', 2, 6)] },
    ...responses,
  });
  return renderRoutes([
    { path: '/', element: <HomePage /> },
    { path: '/jogadores', element: <h1>Tela de jogadores</h1> },
  ]);
}

function numberItem(label: string) {
  return screen.getByText(label).closest('li');
}

describe('HomePage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra os números da liga devolvidos pela API', async () => {
    renderHome({});

    expect(await screen.findByText('23')).toBeInTheDocument();
    expect(numberItem('jogadores')).toHaveTextContent('23jogadores');
    expect(numberItem('livres')).toHaveTextContent('7livres');
    expect(await screen.findByText('clubes')).toBeInTheDocument();
    expect(numberItem('clubes')).toHaveTextContent('6clubes');
    expect(numberItem('partidas')).toHaveTextContent('2partidas');
  });

  it('usa o singular quando a contagem é 1', async () => {
    renderHome({
      '/players?limit=1': PLAYERS_PAGE(1),
      '/players?limit=1&free=true': PLAYERS_PAGE(1),
      '/clubs': { body: [{ id: 1 }] },
      '/matches': { body: [{ id: 1 }] },
    });

    expect(await screen.findByText('jogador')).toBeInTheDocument();
    expect(await screen.findByText('livre')).toBeInTheDocument();
    expect(await screen.findByText('clube')).toBeInTheDocument();
    expect(await screen.findByText('partida')).toBeInTheDocument();
  });

  it('mostra o líder da classificação', async () => {
    renderHome({});

    expect(
      await screen.findByText('líder: Delta FC, 6 pontos'),
    ).toBeInTheDocument();
  });

  it('avisa quando ainda não houve partida', async () => {
    renderHome({ '/standings': { body: [STANDING('Águias FC', 0, 0)] } });

    expect(
      await screen.findByText('nenhuma partida ainda'),
    ).toBeInTheDocument();
  });

  it('mostra um traço no número que a API não devolveu', async () => {
    renderHome({ '/clubs': { status: 500, body: { message: 'Falhou.' } } });

    await screen.findByText('23');
    expect(numberItem('clubes')).toHaveTextContent('–clubes');
  });

  it('vai para a tela de jogadores pelo botão Iniciar', async () => {
    const { router } = renderHome({});

    await userEvent.click(screen.getByRole('link', { name: /iniciar/i }));

    expect(router.state.location.pathname).toBe('/jogadores');
  });

  it('vai para a tela de jogadores pela tecla Enter', async () => {
    const { router } = renderHome({});

    await userEvent.keyboard('{Enter}');

    expect(router.state.location.pathname).toBe('/jogadores');
  });
});
