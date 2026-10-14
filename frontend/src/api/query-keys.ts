import type { PlayerFilters } from './players';

// Chaves do TanStack Query: cada ação invalida as listas que ela altera.
export const queryKeys = {
  players: {
    list: (filters: PlayerFilters) => ['players', 'list', filters] as const,
  },
  clubs: {
    all: ['clubs'] as const,
  },
  matches: {
    all: ['matches'] as const,
  },
  standings: {
    all: ['standings'] as const,
  },
};
