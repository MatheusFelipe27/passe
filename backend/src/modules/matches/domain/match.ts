import { compareRosterOrder } from '../../players/domain/roster-order';
import { Condition, Position } from '../../players/domain/player.types';

export type DuelAttribute = 'shooting' | 'passing' | 'dribbling' | 'defending';

export type MatchResult = 'MANDANTE' | 'VISITANTE' | 'EMPATE';

export interface MatchPlayer {
  id: number;
  name: string;
  position: Position;
  condition: Condition;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
}

export interface MatchTeam {
  clubId: number;
  players: MatchPlayer[];
}

export interface DuelSide {
  player: MatchPlayer;
  attribute: DuelAttribute;
  value: number;
}

export interface Duel {
  order: number;
  attackingClubId: number;
  attacker: DuelSide;
  defender: DuelSide;
  goal: boolean;
}

export interface MatchOutcome {
  duels: Duel[];
  homeGoals: number;
  awayGoals: number;
  result: MatchResult;
}

// RN20, passo 3: MAL_CONDICIONADO joga com 85% de cada atributo.
const UNFIT_PERCENT = 85;

// RN20, passo 4: em cada lado, o 4º ataca o goleiro, o 3º ataca o 1º e o 2º ataca o 2º.
// Os índices são da lista do time na ordem do elenco: 0 é o goleiro, 1 a 4 são os de linha.
const DUELS: { attacker: number; defender: number }[] = [
  { attacker: 4, defender: 0 },
  { attacker: 3, defender: 1 },
  { attacker: 2, defender: 2 },
];

// RN20, passo 3: atributo × 0,85 arredondado para o inteiro mais próximo, com o meio para cima,
// calculado em inteiros para não haver erro de ponto flutuante (50 → 42,5 → 43).
export function playingValue(value: number, condition: Condition): number {
  if (condition !== 'MAL_CONDICIONADO') {
    return value;
  }
  return Math.floor((value * UNFIT_PERCENT + 50) / 100);
}

export function matchResult(homeGoals: number, awayGoals: number): MatchResult {
  if (homeGoals > awayGoals) {
    return 'MANDANTE';
  }
  return homeGoals < awayGoals ? 'VISITANTE' : 'EMPATE';
}

// RN20: os 3 ataques do mandante (duelos 1 a 3) e depois os 3 do visitante (4 a 6).
// É gol quando o ataque é maior que a defesa; duelo empatado não é gol.
export function playMatch(home: MatchTeam, away: MatchTeam): MatchOutcome {
  const duels = [
    ...attacks(home, away, 1),
    ...attacks(away, home, DUELS.length + 1),
  ];
  const goalsOf = (clubId: number) =>
    duels.filter((duel) => duel.goal && duel.attackingClubId === clubId).length;
  const homeGoals = goalsOf(home.clubId);
  const awayGoals = goalsOf(away.clubId);
  return {
    duels,
    homeGoals,
    awayGoals,
    result: matchResult(homeGoals, awayGoals),
  };
}

function attacks(
  attacking: MatchTeam,
  defending: MatchTeam,
  firstOrder: number,
): Duel[] {
  const attackers = inRosterOrder(attacking);
  const defenders = inRosterOrder(defending);
  return DUELS.map((pair, index) => {
    const attacker = side(
      attackers[pair.attacker],
      attackAttribute(attackers[pair.attacker].position),
    );
    const defender = side(defenders[pair.defender], 'defending');
    return {
      order: firstOrder + index,
      attackingClubId: attacking.clubId,
      attacker,
      defender,
      goal: attacker.value > defender.value,
    };
  });
}

// RN20, passo 5: ATA usa finalização, MEI usa passe, e ZAG e LAT usam drible. O goleiro só defende.
function attackAttribute(position: Position): DuelAttribute {
  if (position === 'ATA') {
    return 'shooting';
  }
  return position === 'MEI' ? 'passing' : 'dribbling';
}

// RN20, passo 2: o goleiro e os 4 de linha na ordem do elenco (RN11).
function inRosterOrder(team: MatchTeam): MatchPlayer[] {
  return [...team.players].sort(compareRosterOrder);
}

function side(player: MatchPlayer, attribute: DuelAttribute): DuelSide {
  return {
    player,
    attribute,
    value: playingValue(player[attribute], player.condition),
  };
}
