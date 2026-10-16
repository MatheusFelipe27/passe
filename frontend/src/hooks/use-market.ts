import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buyPlayer, sellPlayer, type PurchaseOrder } from '@/api/market';
import { queryKeys } from '@/api/query-keys';

// Compra e venda mudam o jogador, o elenco e o caixa: as listas de jogadores e de clubes são rebuscadas.
function useMarketInvalidation() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.players.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all }),
    ]);
}

export function useBuyPlayer() {
  const invalidate = useMarketInvalidation();
  return useMutation({
    mutationFn: ({
      playerId,
      order,
    }: {
      playerId: number;
      order: PurchaseOrder;
    }) => buyPlayer(playerId, order),
    onSuccess: invalidate,
  });
}

export function useSellPlayer() {
  const invalidate = useMarketInvalidation();
  return useMutation({
    mutationFn: (playerId: number) => sellPlayer(playerId),
    onSuccess: invalidate,
  });
}
