import { useQuery } from '@tanstack/react-query';
import { getStandings, listMatches } from '@/api/league';
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
