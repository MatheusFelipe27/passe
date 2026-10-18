import type {
  Duel,
  DuelAttribute,
  DuelPlayer,
  MatchDetail,
} from '@/api/league';

// RN20: a vaga de cada titular, pela ordem do elenco: o goleiro e os jogadores de linha do 1º
// (o mais recuado) ao 4º (o mais avançado).
export type LineSlot = 0 | 1 | 2 | 3 | 4;

export const GOALKEEPER_SLOT: LineSlot = 0;

// Os 3 duelos de cada lado, na ordem: o 4º ataca o goleiro, o 3º ataca o 1º e o 2º ataca o 2º.
const ATTACKER_SLOTS: LineSlot[] = [4, 3, 2];
const DEFENDER_SLOTS: LineSlot[] = [0, 1, 2];

export interface DuelValue {
  attribute: DuelAttribute;
  value: number;
}

export interface MatchStarter {
  player: DuelPlayer;
  slot: LineSlot;
  attack?: DuelValue;
  defense?: DuelValue;
  scored: boolean;
}

// Posição do duelo dentro dos 3 ataques do clube: o duelo 1 e o 4 são os primeiros.
function turnOf(duel: Duel): number {
  return (duel.order - 1) % ATTACKER_SLOTS.length;
}

export function attackerSlot(duel: Duel): LineSlot {
  return ATTACKER_SLOTS[turnOf(duel)];
}

export function defenderSlot(duel: Duel): LineSlot {
  return DEFENDER_SLOTS[turnOf(duel)];
}

// Os 5 titulares de um clube montados a partir dos 6 duelos devolvidos pela API, sem recalcular
// nada: cada um com os valores que usou ao atacar e ao defender (o 2º faz os dois).
export function startersOf(match: MatchDetail, clubId: number): MatchStarter[] {
  const starters = new Map<LineSlot, MatchStarter>();
  const entry = (player: DuelPlayer, slot: LineSlot) => {
    const current = starters.get(slot) ?? { player, slot, scored: false };
    starters.set(slot, current);
    return current;
  };
  for (const duel of match.duels) {
    if (duel.attacking_club_id === clubId) {
      const starter = entry(duel.attacker, attackerSlot(duel));
      starter.attack = duel.attacker;
      starter.scored = duel.goal;
    } else {
      entry(duel.defender, defenderSlot(duel)).defense = duel.defender;
    }
  }
  return [...starters.values()].sort((a, b) => a.slot - b.slot);
}

export function slotLabel(slot: LineSlot): string {
  return slot === GOALKEEPER_SLOT ? 'Goleiro' : `${slot}º de linha`;
}
