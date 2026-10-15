import { Fragment } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CircleCheck, Shield, Swords, UserRound, Users } from 'lucide-react';
import { useClubs } from '@/hooks/use-clubs';
import { useMatches } from '@/hooks/use-league';
import { usePlayers } from '@/hooks/use-players';
import { formatInteger, pluralize } from '@/lib/format';

const COUNT_ONLY = { limit: 1 };

interface LeagueNumber {
  icon: LucideIcon;
  count: number | undefined;
  singular: string;
  plural: string;
}

export function LeagueNumbers() {
  const players = usePlayers(COUNT_ONLY);
  const freePlayers = usePlayers({ ...COUNT_ONLY, free: true });
  const clubs = useClubs();
  const matches = useMatches();

  const numbers: LeagueNumber[] = [
    {
      icon: Users,
      count: players.data?.meta.total_items,
      singular: 'jogador',
      plural: 'jogadores',
    },
    {
      icon: UserRound,
      count: freePlayers.data?.meta.total_items,
      singular: 'livre',
      plural: 'livres',
    },
    {
      icon: Shield,
      count: clubs.data?.length,
      singular: 'clube',
      plural: 'clubes',
    },
    {
      icon: Swords,
      count: matches.data?.length,
      singular: 'partida',
      plural: 'partidas',
    },
  ];

  return (
    <ul className="flex items-center gap-4 text-xs leading-4">
      {numbers.map(({ icon: Icon, count, singular, plural }) => (
        <Fragment key={plural}>
          <li className="flex items-center gap-1.5">
            <Icon aria-hidden className="size-3.5 text-muted-foreground" />
            <span className="font-medium">
              {count === undefined ? '–' : formatInteger(count)}
            </span>
            <span className="text-muted-foreground">
              {count === undefined
                ? plural
                : pluralize(count, singular, plural)}
            </span>
          </li>
          <li aria-hidden className="size-[3px] rounded-[2px] bg-border" />
        </Fragment>
      ))}
      <li className="flex items-center gap-1.5 text-muted-foreground">
        <CircleCheck aria-hidden className="size-3.5" />
        Não precisa de login
      </li>
    </ul>
  );
}
