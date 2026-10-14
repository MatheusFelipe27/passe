import { useStandings } from '@/hooks/use-league';
import { pluralize } from '@/lib/format';
import type { Standing } from '@/api/league';

const LEAGUE_NAME = 'Liga Fictícia 2026';

export function LeagueBadge() {
  const { data: standings } = useStandings();
  const status = standings ? describeLeader(standings) : undefined;

  return (
    <div className="flex items-center gap-2 rounded-full border bg-background py-[5px] pr-3 pl-2.5 text-xs leading-4">
      <span aria-hidden className="size-2 rounded-sm bg-success" />
      <span className="font-medium">{LEAGUE_NAME}</span>
      {status && (
        <>
          <span aria-hidden className="text-muted-foreground">
            ·
          </span>
          <span className="text-muted-foreground">{status}</span>
        </>
      )}
    </div>
  );
}

function describeLeader([leader]: Standing[]): string {
  if (!leader || leader.played === 0) {
    return 'nenhuma partida ainda';
  }
  return `líder: ${leader.club_name}, ${leader.points} ${pluralize(leader.points, 'ponto', 'pontos')}`;
}
