import { Position } from '../../players/domain/player.types';

// RN19: os 4 jogadores de linha por setor, de trás para frente; o goleiro fica fora da conta.
export const FORMATIONS = {
  '3-1': { defense: 3, midfield: 0, attack: 1 },
  '2-2': { defense: 2, midfield: 0, attack: 2 },
  '2-1-1': { defense: 2, midfield: 1, attack: 1 },
  '1-2-1': { defense: 1, midfield: 2, attack: 1 },
} as const;

export type Formation = keyof typeof FORMATIONS;

export const FORMATION_NAMES = Object.keys(FORMATIONS) as Formation[];

export const LINEUP_SIZE = 5;

// RN19: exatamente 1 GOL e, em cada setor, a quantidade da formação: defesa (ZAG ou LAT),
// meio (MEI) e ataque (ATA).
export function fitsFormation(
  positions: Position[],
  formation: Formation,
): boolean {
  const count = (...accepted: Position[]) =>
    positions.filter((position) => accepted.includes(position)).length;
  const sectors = FORMATIONS[formation];
  return (
    positions.length === LINEUP_SIZE &&
    count('GOL') === 1 &&
    count('ZAG', 'LAT') === sectors.defense &&
    count('MEI') === sectors.midfield &&
    count('ATA') === sectors.attack
  );
}

// Texto da recusa (RN19): o que a formação pede, sem os setores vazios.
export function describeFormation(formation: Formation): string {
  const sectors = FORMATIONS[formation];
  const parts = [
    '1 GOL',
    `${sectors.defense} entre ZAG e LAT`,
    sectors.midfield > 0 ? `${sectors.midfield} MEI` : null,
    `${sectors.attack} ATA`,
  ].filter((part) => part !== null);
  return `${parts.slice(0, -1).join(', ')} e ${parts.at(-1)}`;
}

// RN19 e RN20: completa com a formação escolhida e os 5 titulares; só assim o clube joga.
export function isLineupComplete(
  formation: string | null,
  starters: number,
): boolean {
  return formation !== null && starters === LINEUP_SIZE;
}
