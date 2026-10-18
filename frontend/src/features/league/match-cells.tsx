import { cn } from 'cn';
import type { MatchResult, MatchSide, MatchSummary } from '@/api/league';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import { RESULT_LABELS } from './match-labels';

// O placar como a API devolveu: gols do mandante × gols do visitante.
export function Score({
  match,
  size = 'sm',
}: {
  match: MatchSummary;
  size?: 'sm' | 'lg';
}) {
  return (
    <span
      aria-label={`${match.home.goals} a ${match.away.goals}`}
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-muted font-semibold tabular-nums',
        size === 'lg' ? 'px-4 py-1.5 text-3xl' : 'px-2.5 py-0.5 text-sm',
      )}
    >
      {match.home.goals} × {match.away.goals}
    </span>
  );
}

export function ResultBadge({ result }: { result: MatchResult }) {
  return (
    <Badge variant="outline" className="rounded-md">
      {RESULT_LABELS[result]}
    </Badge>
  );
}

// Nome do clube com a sigla ao lado; a sigla vem da lista de clubes, porque a partida não a traz.
export function TeamName({
  side,
  acronym,
  bold,
  reverse = false,
}: {
  side: MatchSide;
  acronym: string | undefined;
  bold: boolean;
  reverse?: boolean;
}) {
  const name = (
    <span className={cn(bold && 'font-semibold')}>{side.club_name}</span>
  );
  const badge = acronym && (
    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium">
      {acronym}
    </span>
  );
  // No visitante, a sigla vem antes do nome, na tela e na leitura.
  return (
    <span className="flex items-center gap-2">
      {reverse ? badge : name}
      {reverse ? name : badge}
    </span>
  );
}

interface ScoreboardProps {
  match: MatchSummary;
  acronymOf: (id: number) => string | undefined;
  // Na página da partida, cada lado mostra também a formação usada.
  showFormation?: boolean;
}

// Mandante e visitante dos dois lados do placar, com a data e o resultado no meio.
export function Scoreboard({
  match,
  acronymOf,
  showFormation = false,
}: ScoreboardProps) {
  const role = (label: string, side: MatchSide) =>
    showFormation ? `${label} · ${side.formation}` : label;
  return (
    <div className="flex flex-1 items-center justify-center gap-6">
      <ScoreboardSide
        name={match.home.club_name}
        role={role('Mandante', match.home)}
        acronym={acronymOf(match.home.club_id)}
      />
      <div className="flex flex-col items-center gap-1.5">
        <Score match={match} size="lg" />
        <span className="text-xs text-muted-foreground">
          {formatDateTime(match.played_at)}
        </span>
        <ResultBadge result={match.result} />
      </div>
      <ScoreboardSide
        name={match.away.club_name}
        role={role('Visitante', match.away)}
        acronym={acronymOf(match.away.club_id)}
        reverse
      />
    </div>
  );
}

function ScoreboardSide({
  name,
  role,
  acronym,
  reverse = false,
}: {
  name: string;
  role: string;
  acronym: string | undefined;
  reverse?: boolean;
}) {
  const label = (
    <span className={reverse ? 'flex flex-col' : 'flex flex-col items-end'}>
      <span className="font-semibold">{name}</span>
      <span className="text-xs text-muted-foreground">{role}</span>
    </span>
  );
  const badge = acronym && (
    <span className="flex size-12 items-center justify-center rounded-xl border bg-muted text-sm font-semibold">
      {acronym}
    </span>
  );
  // No visitante, a sigla vem antes do nome, como no TeamName.
  return (
    <div
      className={cn(
        'flex flex-1 items-center gap-3',
        reverse ? 'justify-start' : 'justify-end',
      )}
    >
      {reverse ? badge : label}
      {reverse ? label : badge}
    </div>
  );
}
