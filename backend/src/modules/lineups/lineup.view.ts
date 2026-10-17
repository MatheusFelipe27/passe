import { Club, Player } from '../../generated/prisma/client';
import { compareRosterOrder } from '../players/domain/roster-order';
import { PlayerView, toPlayerView } from '../players/player.view';
import { Formation, isLineupComplete } from './domain/formation';

export interface LineupView {
  club_id: number;
  formation: Formation | null;
  complete: boolean;
  players: PlayerView[];
}

// RN19: os titulares na ordem do elenco; incompleta enquanto faltar titular ou formação.
export function toLineupView(club: Club, starters: Player[]): LineupView {
  const formation = club.formation as Formation | null;
  return {
    club_id: club.id,
    formation,
    complete: isLineupComplete(formation, starters.length),
    players: starters.map(toPlayerView).sort(compareRosterOrder),
  };
}
