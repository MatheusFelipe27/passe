import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  changeCondition,
  createPlayer,
  deletePlayer,
  getPlayer,
  listPlayers,
  updatePlayer,
  type Condition,
  type NewPlayer,
  type PlayerEdit,
  type PlayerFilters,
} from '@/api/players';
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

export function usePlayer(id: number) {
  return useQuery({
    queryKey: queryKeys.players.detail(id),
    queryFn: () => getPlayer(id),
  });
}

// Toda ação sobre jogadores rebusca as listas, as contagens e os detalhes abertos, e também os
// clubes: o valor de mercado de um jogador entra no valor do elenco e no patrimônio do clube dele.
function usePlayersInvalidation() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.players.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all }),
    ]);
}

export function useCreatePlayer() {
  const invalidate = usePlayersInvalidation();
  return useMutation({
    mutationFn: (player: NewPlayer) => createPlayer(player),
    onSuccess: invalidate,
  });
}

export function useUpdatePlayer() {
  const invalidate = usePlayersInvalidation();
  return useMutation({
    mutationFn: ({ id, edit }: { id: number; edit: PlayerEdit }) =>
      updatePlayer(id, edit),
    onSuccess: invalidate,
  });
}

export function useChangeCondition() {
  const invalidate = usePlayersInvalidation();
  return useMutation({
    mutationFn: ({ id, condition }: { id: number; condition: Condition }) =>
      changeCondition(id, condition),
    onSuccess: invalidate,
  });
}

export function useDeletePlayer() {
  const invalidate = usePlayersInvalidation();
  return useMutation({
    mutationFn: (id: number) => deletePlayer(id),
    onSuccess: invalidate,
  });
}
