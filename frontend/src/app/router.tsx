import { createBrowserRouter } from 'react-router';
import { AppLayout, type RouteHandle } from '@/components/layout/app-layout';
import { HomePage } from '@/features/home/home-page';
import { NotFoundPage } from '@/features/not-found/not-found-page';
import { PlayersPage } from '@/features/players/players-page';

const playersHandle: RouteHandle = { breadcrumb: ['Mercado', 'Jogadores'] };

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/jogadores', element: <PlayersPage />, handle: playersHandle },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
