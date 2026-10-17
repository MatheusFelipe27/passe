import { Condition, Position } from '../../players/domain/player.types';
import {
  matchResult,
  MatchPlayer,
  MatchTeam,
  playingValue,
  playMatch,
} from './match';

function player(
  id: number,
  name: string,
  position: Position,
  values: Partial<MatchPlayer> = {},
  condition: Condition = 'APTO',
): MatchPlayer {
  return {
    id,
    name,
    position,
    condition,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defending: 50,
    ...values,
  };
}

// O exemplo completo da RN20: Águias FC (mandante) × Delta FC (visitante), os dois no 2-1-1.
const AGUIAS: MatchTeam = {
  clubId: 1,
  players: [
    player(34, 'Otto Rangel', 'ATA', { shooting: 75 }),
    player(
      31,
      'Davi Lins',
      'LAT',
      { dribbling: 74, defending: 66 },
      'MAL_CONDICIONADO',
    ),
    player(30, 'Rui Prado', 'GOL', { defending: 77 }),
    player(33, 'Lauro Neves', 'MEI', { passing: 82 }),
    player(32, 'Téo Brandão', 'ZAG', { defending: 84 }),
  ],
};

const DELTA: MatchTeam = {
  clubId: 2,
  players: [
    player(40, 'Ivo Teles', 'GOL', { defending: 72 }),
    player(41, 'Hugo Vaz', 'ZAG', { defending: 84 }),
    player(42, 'Lino Matos', 'LAT', { dribbling: 79, defending: 63 }),
    player(43, 'Nei Soares', 'MEI', { passing: 70 }),
    player(44, 'Ugo Falcão', 'ATA', { shooting: 81 }),
  ],
};

function summary(home: MatchTeam, away: MatchTeam) {
  return playMatch(home, away).duels.map((duel) => [
    duel.order,
    duel.attacker.player.name,
    duel.attacker.attribute,
    duel.attacker.value,
    duel.defender.player.name,
    duel.defender.value,
    duel.goal,
  ]);
}

describe('playingValue', () => {
  it.each([
    [74, 63],
    [50, 43],
    [66, 56],
    [10, 9],
    [99, 84],
    [2, 2],
    [1, 1],
  ])('MAL_CONDICIONADO: %i × 0,85 → %i', (value, expected) => {
    expect(playingValue(value, 'MAL_CONDICIONADO')).toBe(expected);
  });

  it.each([1, 50, 74, 99])('APTO joga com o próprio valor (%i)', (value) => {
    expect(playingValue(value, 'APTO')).toBe(value);
  });
});

describe('matchResult', () => {
  it.each([
    [3, 0, 'MANDANTE'],
    [1, 0, 'MANDANTE'],
    [0, 0, 'EMPATE'],
    [3, 3, 'EMPATE'],
    [1, 2, 'VISITANTE'],
    [0, 3, 'VISITANTE'],
  ])('%i × %i → %s', (home, away, result) => {
    expect(matchResult(home, away)).toBe(result);
  });
});

describe('playMatch', () => {
  it('reproduz o exemplo da RN20: Águias FC 1 × 2 Delta FC', () => {
    expect(summary(AGUIAS, DELTA)).toEqual([
      [1, 'Otto Rangel', 'shooting', 75, 'Ivo Teles', 72, true],
      [2, 'Lauro Neves', 'passing', 82, 'Hugo Vaz', 84, false],
      [3, 'Davi Lins', 'dribbling', 63, 'Lino Matos', 63, false],
      [4, 'Ugo Falcão', 'shooting', 81, 'Rui Prado', 77, true],
      [5, 'Nei Soares', 'passing', 70, 'Téo Brandão', 84, false],
      [6, 'Lino Matos', 'dribbling', 79, 'Davi Lins', 56, true],
    ]);

    const outcome = playMatch(AGUIAS, DELTA);
    expect([outcome.homeGoals, outcome.awayGoals, outcome.result]).toEqual([
      1,
      2,
      'VISITANTE',
    ]);
    expect(outcome.duels.map((duel) => duel.attackingClubId)).toEqual([
      1, 1, 1, 2, 2, 2,
    ]);
    expect(
      outcome.duels.every((duel) => duel.defender.attribute === 'defending'),
    ).toBe(true);
  });

  it('a ordem dos jogadores recebida não muda o resultado', () => {
    const shuffled = { ...AGUIAS, players: [...AGUIAS.players].reverse() };

    expect(summary(shuffled, DELTA)).toEqual(summary(AGUIAS, DELTA));
  });

  it('ser mandante só muda a numeração dos duelos, não o placar', () => {
    const reversed = playMatch(DELTA, AGUIAS);

    expect([reversed.homeGoals, reversed.awayGoals, reversed.result]).toEqual([
      2,
      1,
      'MANDANTE',
    ]);
  });

  it('não é gol com ataque igual à defesa, e é com um ponto a mais', () => {
    const team = (
      clubId: number,
      attack: number,
      defense: number,
    ): MatchTeam => ({
      clubId,
      players: [
        player(clubId * 10, 'Goleiro Um', 'GOL', { defending: defense }),
        player(clubId * 10 + 1, 'Zagueiro Um', 'ZAG', { defending: defense }),
        player(clubId * 10 + 2, 'Lateral Um', 'LAT', {
          dribbling: attack,
          defending: defense,
        }),
        player(clubId * 10 + 3, 'Meia Um', 'MEI', { passing: attack }),
        player(clubId * 10 + 4, 'Atacante Um', 'ATA', { shooting: attack }),
      ],
    });

    expect(playMatch(team(1, 60, 60), team(2, 60, 60))).toMatchObject({
      homeGoals: 0,
      awayGoals: 0,
      result: 'EMPATE',
    });
    expect(playMatch(team(1, 61, 60), team(2, 60, 60))).toMatchObject({
      homeGoals: 3,
      awayGoals: 0,
      result: 'MANDANTE',
    });
    expect(playMatch(team(1, 60, 60), team(2, 61, 60))).toMatchObject({
      homeGoals: 0,
      awayGoals: 3,
      result: 'VISITANTE',
    });
  });

  it.each<[string, Position[], [string, string][]]>([
    [
      '3-1',
      ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA'],
      [
        ['ATA', 'shooting'],
        ['LAT', 'dribbling'],
        ['LAT', 'dribbling'],
      ],
    ],
    [
      '2-2',
      ['GOL', 'ZAG', 'LAT', 'ATA', 'ATA'],
      [
        ['ATA', 'shooting'],
        ['ATA', 'shooting'],
        ['LAT', 'dribbling'],
      ],
    ],
    [
      '2-1-1',
      ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'],
      [
        ['ATA', 'shooting'],
        ['MEI', 'passing'],
        ['LAT', 'dribbling'],
      ],
    ],
    [
      '1-2-1',
      ['GOL', 'ZAG', 'MEI', 'MEI', 'ATA'],
      [
        ['ATA', 'shooting'],
        ['MEI', 'passing'],
        ['MEI', 'passing'],
      ],
    ],
  ])(
    'no %s, ataca com os 3 jogadores de linha mais avançados',
    (_, positions, expected) => {
      const team: MatchTeam = {
        clubId: 1,
        players: positions.map((position, index) =>
          player(index + 1, `Jogador ${index + 1}`, position),
        ),
      };

      const attacks = playMatch(team, { ...team, clubId: 2 }).duels.slice(0, 3);

      expect(
        attacks.map((duel) => [
          duel.attacker.player.position,
          duel.attacker.attribute,
        ]),
      ).toEqual(expected);
      expect(attacks.map((duel) => duel.defender.player.position)).toEqual([
        'GOL',
        positions[1],
        positions[2],
      ]);
    },
  );

  it('no 1-2-1, os dois MEI seguem o nome: o primeiro é o 2º jogador de linha', () => {
    const team: MatchTeam = {
      clubId: 1,
      players: [
        player(1, 'Gol Leiro', 'GOL'),
        player(2, 'Zé Zagueiro', 'ZAG'),
        player(9, 'Bia Meia', 'MEI'),
        player(8, 'Ana Meia', 'MEI'),
        player(5, 'Atacante Bom', 'ATA'),
      ],
    };

    const outcome = playMatch(team, { ...team, clubId: 2 });

    expect(outcome.duels[1].attacker.player.name).toBe('Bia Meia');
    expect(outcome.duels[2].attacker.player.name).toBe('Ana Meia');
    expect(outcome.duels[2].defender.player.name).toBe('Ana Meia');
  });

  it('aplica a condição ao atacante e ao defensor', () => {
    const unfit: MatchTeam = {
      ...DELTA,
      players: DELTA.players.map((item) => ({
        ...item,
        condition: 'MAL_CONDICIONADO',
      })),
    };

    const duels = playMatch(AGUIAS, unfit).duels;

    // Defesa do goleiro: 72 × 0,85 = 61,2 → 61; finalização do ATA: 81 × 0,85 = 68,85 → 69.
    expect([duels[0].defender.value, duels[0].goal]).toEqual([61, true]);
    expect([duels[3].attacker.value, duels[3].goal]).toEqual([69, false]);
  });
});
