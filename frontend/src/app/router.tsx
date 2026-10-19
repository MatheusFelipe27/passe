import { createBrowserRouter } from 'react-router';
import { AppLayout, type RouteHandle } from '@/components/layout/app-layout';
import { ClubCrumb } from '@/features/clubs/club-crumb';
import { ClubPage } from '@/features/clubs/club-page';
import { ClubsPage } from '@/features/clubs/clubs-page';
import { HomePage } from '@/features/home/home-page';
import { MatchCrumb } from '@/features/league/match-crumb';
import { MatchPage } from '@/features/league/match-page';
import { MatchesPage } from '@/features/league/matches-page';
import { StandingsPage } from '@/features/league/standings-page';
import { NotFoundPage } from '@/features/not-found/not-found-page';
import { PlayersPage } from '@/features/players/players-page';

const playersHandle: RouteHandle = { breadcrumb: ['Mercado', 'Jogadores'] };
const clubsHandle: RouteHandle = { breadcrumb: ['Mercado', 'Clubes'] };
const clubHandle: RouteHandle = { ...clubsHandle, current: ClubCrumb };
const matchesHandle: RouteHandle = { breadcrumb: ['Liga', 'Partidas'] };
const matchHandle: RouteHandle = { ...matchesHandle, current: MatchCrumb };
const standingsHandle: RouteHandle = { breadcrumb: ['Liga', 'Classificação'] };

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/jogadores', element: <PlayersPage />, handle: playersHandle },
      { path: '/clubes', element: <ClubsPage />, handle: clubsHandle },
      { path: '/clubes/:id', element: <ClubPage />, handle: clubHandle },
      { path: '/partidas', element: <MatchesPage />, handle: matchesHandle },
      { path: '/partidas/:id', element: <MatchPage />, handle: matchHandle },
      {
        path: '/classificacao',
        element: <StandingsPage />,
        handle: standingsHandle,
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
