import type { Duel, DuelPlayer, MatchDetail } from '@/api/league';

// O exemplo completo da RN20 (Águias FC 1 × 2 Delta FC), com os duelos como a API devolve.
// Usado pelos testes da página da partida e da montagem dos titulares.

function person(
  id: number,
  name: string,
  position: DuelPlayer['position'],
  attribute: DuelPlayer['attribute'],
  value: number,
  condition: DuelPlayer['condition'] = 'APTO',
): DuelPlayer {
  return {
    player_id: id,
    player_name: name,
    position,
    condition,
    attribute,
    value,
  };
}

function duel(
  order: number,
  attackingClubId: number,
  attacker: DuelPlayer,
  defender: DuelPlayer,
  goal: boolean,
): Duel {
  return {
    order,
    attacking_club_id: attackingClubId,
    attacker,
    defender,
    goal,
  };
}

export const RN20_MATCH: MatchDetail = {
  id: 1,
  played_at: '2026-11-12T15:00:00-03:00',
  home: { club_id: 1, club_name: 'Águias FC', formation: '2-1-1', goals: 1 },
  away: { club_id: 2, club_name: 'Delta FC', formation: '2-1-1', goals: 2 },
  result: 'VISITANTE',
  duels: [
    duel(
      1,
      1,
      person(34, 'Otto Rangel', 'ATA', 'shooting', 75),
      person(40, 'Ivo Teles', 'GOL', 'defending', 72),
      true,
    ),
    duel(
      2,
      1,
      person(33, 'Lauro Neves', 'MEI', 'passing', 82),
      person(41, 'Hugo Vaz', 'ZAG', 'defending', 84),
      false,
    ),
    duel(
      3,
      1,
      person(31, 'Davi Lins', 'LAT', 'dribbling', 63, 'MAL_CONDICIONADO'),
      person(42, 'Lino Matos', 'LAT', 'defending', 63),
      false,
    ),
    duel(
      4,
      2,
      person(44, 'Ugo Falcão', 'ATA', 'shooting', 81),
      person(30, 'Rui Prado', 'GOL', 'defending', 77),
      true,
    ),
    duel(
      5,
      2,
      person(43, 'Nei Soares', 'MEI', 'passing', 70),
      person(32, 'Téo Brandão', 'ZAG', 'defending', 84),
      false,
    ),
    duel(
      6,
      2,
      person(42, 'Lino Matos', 'LAT', 'dribbling', 79),
      person(31, 'Davi Lins', 'LAT', 'defending', 56, 'MAL_CONDICIONADO'),
      true,
    ),
  ],
};
