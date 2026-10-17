import { compareSortKeys, toSortKey } from '../../../common/text/text';

// RN21: vitória vale 3 pontos, empate 1 e derrota 0.
export const WIN_POINTS = 3;
export const DRAW_POINTS = 1;

export interface StandingClub {
  id: number;
  name: string;
}

export interface MatchScore {
  homeClubId: number;
  awayClubId: number;
  homeGoals: number;
  awayGoals: number;
}

export interface Standing {
  position: number;
  clubId: number;
  clubName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

type Row = Omit<Standing, 'position'>;

// RN21: todos os clubes, inclusive os que ainda não jogaram, calculados a cada consulta.
export function calculateStandings(
  clubs: StandingClub[],
  matches: MatchScore[],
): Standing[] {
  const rows = new Map<number, Row>(
    clubs.map((club) => [club.id, emptyRow(club)]),
  );
  for (const match of matches) {
    record(rows.get(match.homeClubId)!, match.homeGoals, match.awayGoals);
    record(rows.get(match.awayClubId)!, match.awayGoals, match.homeGoals);
  }
  return [...rows.values()]
    .sort(compareStandings)
    .map((row, index) => ({ position: index + 1, ...row }));
}

function emptyRow(club: StandingClub): Row {
  return {
    clubId: club.id,
    clubName: club.name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function record(row: Row, scored: number, conceded: number) {
  row.played += 1;
  row.goalsFor += scored;
  row.goalsAgainst += conceded;
  row.goalDifference = row.goalsFor - row.goalsAgainst;
  if (scored > conceded) {
    row.wins += 1;
    row.points += WIN_POINTS;
  } else if (scored === conceded) {
    row.draws += 1;
    row.points += DRAW_POINTS;
  } else {
    row.losses += 1;
  }
}

// RN21: mais pontos, maior saldo, mais gols marcados, o nome (Premissas) e, por fim, o id.
function compareStandings(a: Row, b: Row): number {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    compareSortKeys(toSortKey(a.clubName), toSortKey(b.clubName)) ||
    a.clubId - b.clubId
  );
}
