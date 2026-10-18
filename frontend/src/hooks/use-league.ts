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

// Sem clube, não há escalação para buscar.
export function useLineup(clubId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clubs.lineup(clubId ?? ''),
    queryFn: () => getLineup(clubId!),
    enabled: clubId !== undefined,
  });
}

// RN19: se o jogador está na escalação do clube dele; jogador livre nunca é titular.
export function useIsStarter(player: { id: number; club_id: number | null }) {
  const lineup = useLineup(
    player.club_id === null ? undefined : String(player.club_id),
  );
  return (
    lineup.data?.players.some((starter) => starter.id === player.id) ?? false
  );
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
