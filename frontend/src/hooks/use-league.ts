import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getLineup,
  getStandings,
  listMatches,
  saveLineup,
  type LineupOrder,
} from '@/api/league';
import { queryKeys } from '@/api/query-keys';

export function useMatches() {
  return useQuery({ queryKey: queryKeys.matches.all, queryFn: listMatches });
}

export function useStandings() {
  return useQuery({
    queryKey: queryKeys.standings.all,
    queryFn: getStandings,
  });
}

export function useLineup(clubId: string) {
  return useQuery({
    queryKey: queryKeys.clubs.lineup(clubId),
    queryFn: () => getLineup(clubId),
  });
}

// Escalar não muda o caixa nem o elenco: só a escalação passa a ser a devolvida pela API.
export function useSaveLineup(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: LineupOrder) => saveLineup(clubId, order),
    onSuccess: (lineup) =>
      queryClient.setQueryData(queryKeys.clubs.lineup(clubId), lineup),
  });
}
