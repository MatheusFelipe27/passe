import type { MatchResult, MatchSide, MatchSummary } from '@/api/league';

export const RESULT_LABELS: Record<MatchResult, string> = {
  MANDANTE: 'Vitória do mandante',
  VISITANTE: 'Vitória do visitante',
  EMPATE: 'Empate',
};

// Quem venceu aparece em negrito; no empate, nenhum dos dois.
export function isWinner(match: MatchSummary, side: MatchSide): boolean {
  const other = side === match.home ? match.away : match.home;
  return side.goals > other.goals;
}
