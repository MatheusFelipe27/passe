import { useQuery } from '@tanstack/react-query';
import { listPlayers, type PlayerFilters } from '@/api/players';
import { queryKeys } from '@/api/query-keys';

export function usePlayers(filters: PlayerFilters = {}) {
  return useQuery({
    queryKey: queryKeys.players.list(filters),
    queryFn: () => listPlayers(filters),
  });
}
