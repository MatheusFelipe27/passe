import type { ClubSort } from './clubs';
import type { TransactionFilters } from './market';
import type { PlayerFilters } from './players';

// Chaves do TanStack Query: cada ação invalida as listas que ela altera.
export const queryKeys = {
  players: {
    all: ['players'] as const,
    list: (filters: PlayerFilters) => ['players', 'list', filters] as const,
    detail: (id: number) => ['players', 'detail', id] as const,
  },
  clubs: {
    all: ['clubs'] as const,
    list: (sort: ClubSort) => ['clubs', 'list', sort] as const,
    detail: (id: string) => ['clubs', 'detail', id] as const,
    // Dentro de "clubs": compra e venda já rebuscam tudo o que começa por essa chave.
    transactions: (id: string, filters: TransactionFilters) =>
      ['clubs', 'transactions', id, filters] as const,
  },
  matches: {
    all: ['matches'] as const,
  },
  standings: {
    all: ['standings'] as const,
  },
};
