import type { ReactNode } from 'react';
import type { Player } from '@/api/players';
import { PlayerAvatar } from './player-cells';
import { POSITION_NAMES } from './player-labels';

// Resumo do jogador nas janelas de ação: avatar, nome, posição e idade, com um selo à direita.
export function PlayerSummary({
  player,
  badge,
}: {
  player: Player;
  badge: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted-subtle p-3">
      <PlayerAvatar player={player} />
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium">{player.name}</span>
        <span className="text-xs text-muted-foreground">
          {player.position} · {POSITION_NAMES[player.position]} · {player.age}{' '}
          anos
        </span>
      </div>
      {badge}
    </div>
  );
}
