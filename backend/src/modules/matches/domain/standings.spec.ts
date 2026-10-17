import { calculateStandings, MatchScore, StandingClub } from './standings';

function score(
  homeClubId: number,
  homeGoals: number,
  awayGoals: number,
  awayClubId: number,
): MatchScore {
  return { homeClubId, awayClubId, homeGoals, awayGoals };
}

function table(clubs: StandingClub[], matches: MatchScore[]) {
  return calculateStandings(clubs, matches).map((row) => [
    row.position,
    row.clubName,
    row.points,
    row.goalDifference,
    row.goalsFor,
  ]);
}

describe('calculateStandings', () => {
  // O exemplo da RN21: 6 clubes e 4 partidas.
  const CLUBS: StandingClub[] = [
    { id: 1, name: 'Águias FC' },
    { id: 2, name: 'Delta FC' },
    { id: 3, name: 'Gama SC' },
    { id: 4, name: 'Épsilon EC' },
    { id: 5, name: 'Tubarões EC' },
    { id: 6, name: 'Mangue FC' },
  ];
  const MATCHES = [
    score(1, 1, 2, 2),
    score(3, 2, 1, 4),
    score(4, 3, 2, 1),
    score(2, 0, 1, 3),
  ];

  it('reproduz o exemplo da RN21', () => {
    expect(table(CLUBS, MATCHES)).toEqual([
      [1, 'Gama SC', 6, 2, 3],
      [2, 'Épsilon EC', 3, 0, 4],
      [3, 'Delta FC', 3, 0, 2],
      [4, 'Mangue FC', 0, 0, 0],
      [5, 'Tubarões EC', 0, 0, 0],
      [6, 'Águias FC', 0, -2, 3],
    ]);
  });

  it('conta jogos, vitórias, empates, derrotas e gols de cada clube', () => {
    const rows = calculateStandings(CLUBS, [...MATCHES, score(5, 2, 2, 6)]);

    expect(rows.find((row) => row.clubName === 'Águias FC')).toEqual({
      position: 6,
      clubId: 1,
      clubName: 'Águias FC',
      played: 2,
      wins: 0,
      draws: 0,
      losses: 2,
      goalsFor: 3,
      goalsAgainst: 5,
      goalDifference: -2,
      points: 0,
    });
    expect(rows.find((row) => row.clubName === 'Mangue FC')).toMatchObject({
      played: 1,
      wins: 0,
      draws: 1,
      losses: 0,
      goalsFor: 2,
      goalsAgainst: 2,
      points: 1,
    });
  });

  it('sem partidas, todos zerados, pelo nome', () => {
    expect(table(CLUBS, [])).toEqual([
      [1, 'Águias FC', 0, 0, 0],
      [2, 'Delta FC', 0, 0, 0],
      [3, 'Épsilon EC', 0, 0, 0],
      [4, 'Gama SC', 0, 0, 0],
      [5, 'Mangue FC', 0, 0, 0],
      [6, 'Tubarões EC', 0, 0, 0],
    ]);
  });

  it('sem clubes, a lista é vazia', () => {
    expect(calculateStandings([], [])).toEqual([]);
  });

  it('empate vale 1 ponto para cada lado, inclusive 0 × 0', () => {
    const clubs = [
      { id: 1, name: 'Alfa FC' },
      { id: 2, name: 'Beta FC' },
    ];

    expect(table(clubs, [score(1, 0, 0, 2)])).toEqual([
      [1, 'Alfa FC', 1, 0, 0],
      [2, 'Beta FC', 1, 0, 0],
    ]);
  });

  it('o critério anterior vence o seguinte', () => {
    const clubs = [
      { id: 1, name: 'Alfa FC' },
      { id: 2, name: 'Beta FC' },
      { id: 3, name: 'Gama FC' },
      { id: 4, name: 'Zeta FC' },
    ];

    // Zeta: 3 pts, saldo +1. Gama: 3 pts, saldo +3. Alfa: 1 pt com 3 gols. Beta: 1 pt.
    expect(
      table(clubs, [score(4, 1, 0, 1), score(3, 3, 0, 2), score(1, 3, 3, 2)]),
    ).toEqual([
      [1, 'Gama FC', 3, 3, 3],
      [2, 'Zeta FC', 3, 1, 1],
      [3, 'Alfa FC', 1, -1, 3],
      [4, 'Beta FC', 1, -3, 3],
    ]);
  });

  it('no empate de pontos e saldo, vem quem marcou mais gols', () => {
    const clubs = [
      { id: 1, name: 'Alfa FC' },
      { id: 2, name: 'Beta FC' },
    ];

    expect(table(clubs, [score(1, 1, 1, 2), score(2, 2, 2, 1)])).toEqual([
      [1, 'Alfa FC', 2, 0, 3],
      [2, 'Beta FC', 2, 0, 3],
    ]);
    expect(table(clubs, [score(1, 0, 0, 2), score(2, 1, 1, 1)])).toEqual([
      [1, 'Alfa FC', 2, 0, 1],
      [2, 'Beta FC', 2, 0, 1],
    ]);
  });

  it('o nome ignora acentos e maiúsculas, e o id desfaz o empate exato', () => {
    const clubs = [
      { id: 7, name: 'Águias FC' },
      { id: 3, name: 'aguias fc' },
      { id: 5, name: 'Aguias FB' },
      { id: 4, name: 'Ébano FC' },
    ];

    expect(table(clubs, []).map(([, name]) => name)).toEqual([
      'Aguias FB',
      'aguias fc',
      'Águias FC',
      'Ébano FC',
    ]);
  });

  it('partidas repetidas entre os mesmos clubes somam todas', () => {
    const clubs = [
      { id: 1, name: 'Alfa FC' },
      { id: 2, name: 'Beta FC' },
    ];

    expect(
      calculateStandings(clubs, [
        score(1, 3, 0, 2),
        score(1, 3, 0, 2),
        score(2, 1, 0, 1),
      ])[0],
    ).toMatchObject({
      clubName: 'Alfa FC',
      played: 3,
      wins: 2,
      losses: 1,
      points: 6,
    });
  });
});
