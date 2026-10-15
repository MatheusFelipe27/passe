import { cn } from 'cn';
import type { Club } from '@/api/clubs';
import type { Condition, Player } from '@/api/players';
import { Badge } from '@/components/ui/badge';
import { CONDITION_NAMES, POSITION_NAMES } from './player-labels';

const AVATAR_COLORS = [
  'bg-avatar-zinc text-avatar-zinc-foreground',
  'bg-avatar-pink text-avatar-pink-foreground',
  'bg-avatar-cyan text-avatar-cyan-foreground',
  'bg-avatar-violet text-avatar-violet-foreground',
  'bg-avatar-teal text-avatar-teal-foreground',
];

const CONDITION_STYLES: Record<Condition, string> = {
  APTO: 'border-success-soft-border bg-success-soft text-success-soft-foreground',
  MAL_CONDICIONADO:
    'border-warning-soft-border bg-warning-soft text-warning-soft-foreground',
  DOENTE:
    'border-destructive-soft-border bg-destructive-soft text-destructive-soft-foreground',
};

// Cores da barra seguem as faixas de agilidade que mudam o desconto (RN03).
const HIGH_AGILITY = 80;
const LOW_AGILITY = 30;

export function PlayerAvatar({ player }: { player: Player }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium',
        AVATAR_COLORS[player.id % AVATAR_COLORS.length],
      )}
    >
      {initials(player.name)}
    </span>
  );
}

export function PlayerIdentity({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-3">
      <PlayerAvatar player={player} />
      <div className="flex flex-col">
        <span className="font-medium">{player.name}</span>
        <span className="text-xs text-muted-foreground">
          {POSITION_NAMES[player.position]}
        </span>
      </div>
    </div>
  );
}

export function PositionBadge({ position }: { position: Player['position'] }) {
  return <Badge variant="outline">{position}</Badge>;
}

export function ConditionBadge({ condition }: { condition: Condition }) {
  return (
    <Badge variant="outline" className={CONDITION_STYLES[condition]}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {CONDITION_NAMES[condition]}
    </Badge>
  );
}

export function AgilityBar({ agility }: { agility: number }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span>{agility}</span>
      <span aria-hidden className="h-1.5 w-10 rounded-full bg-muted">
        <span
          className={cn(
            'block h-1.5 rounded-full',
            agility >= HIGH_AGILITY && 'bg-success',
            agility <= LOW_AGILITY && 'bg-destructive',
            agility > LOW_AGILITY &&
              agility < HIGH_AGILITY &&
              'bg-muted-foreground',
          )}
          style={{ width: `${agility}%` }}
        />
      </span>
    </div>
  );
}

export function PlayerClub({
  clubId,
  clubs,
}: {
  clubId: number | null;
  clubs: Map<number, Club>;
}) {
  if (clubId === null) {
    return <Badge variant="secondary">Livre</Badge>;
  }
  const club = clubs.get(clubId);
  return (
    <span className="flex items-center gap-2">
      {club && (
        <span className="rounded-sm bg-muted px-1 text-xs font-medium">
          {club.acronym}
        </span>
      )}
      <span>{club?.name ?? `Clube ${clubId}`}</span>
    </span>
  );
}

function initials(name: string): string {
  const words = name.split(' ');
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}
