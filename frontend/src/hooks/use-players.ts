import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listPlayers, type PlayerFilters } from '@/api/players';
import { queryKeys } from '@/api/query-keys';

interface UsePlayersOptions {
  enabled?: boolean;
}

export function usePlayers(
  filters: PlayerFilters = {},
  { enabled = true }: UsePlayersOptions = {},
) {
  return useQuery({
    queryKey: queryKeys.players.list(filters),
    queryFn: () => listPlayers(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}
