import { cn } from 'cn';
import type { MatchResult, MatchSide, MatchSummary } from '@/api/league';
import { Badge } from '@/components/ui/badge';
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
