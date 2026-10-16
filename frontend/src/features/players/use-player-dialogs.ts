import { useState } from 'react';
import type { Player } from '@/api/players';
import type { BoughtPlayer } from '@/features/market/buy-player-dialog';
import type { PlayerAction } from './player-row-actions';

type OpenDialog =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'created'; player: Player }
  | { kind: 'details'; playerId: number }
  | { kind: 'edit'; player: Player }
  | { kind: 'condition'; player: Player }
  | { kind: 'buy'; player: Player }
  | { kind: 'bought'; result: BoughtPlayer }
  | { kind: 'delete'; player: Player };

// Qual janela da tela de jogadores está aberta; abrir uma fecha a anterior.
export function usePlayerDialogs() {
  const [dialog, setDialog] = useState<OpenDialog>({ kind: 'none' });

  function playerFor(
    kind: 'edit' | 'condition' | 'buy' | 'delete',
  ): Player | undefined {
    return dialog.kind === kind ? dialog.player : undefined;
  }

  return {
    isCreating: dialog.kind === 'create',
    createdPlayer: dialog.kind === 'created' ? dialog.player : undefined,
    detailsPlayerId: dialog.kind === 'details' ? dialog.playerId : undefined,
    editingPlayer: playerFor('edit'),
    conditionPlayer: playerFor('condition'),
    deletingPlayer: playerFor('delete'),
    buyingPlayer: playerFor('buy'),
    boughtPlayer: dialog.kind === 'bought' ? dialog.result : undefined,
    openCreate: () => setDialog({ kind: 'create' }),
    showCreated: (player: Player) => setDialog({ kind: 'created', player }),
    showBought: (result: BoughtPlayer) => setDialog({ kind: 'bought', result }),
    openAction: (action: PlayerAction, player: Player) =>
      setDialog(
        action === 'details'
          ? { kind: 'details', playerId: player.id }
          : { kind: action, player },
      ),
    close: () => setDialog({ kind: 'none' }),
  };
}
