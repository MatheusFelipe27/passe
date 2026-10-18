import type { Formation } from '@/api/league';
import type { Player, PlayerAttributes, Position } from '@/api/players';

export type Sector = 'GOL' | 'DEF' | 'MEI' | 'ATA';

type FieldSector = Exclude<Sector, 'GOL'>;

export const FORMATIONS: Formation[] = ['3-1', '2-2', '2-1-1', '1-2-1'];

// RN19: os 4 jogadores de linha por setor, de trás para frente; o goleiro fica fora da conta.
const FIELD_SECTORS: Record<Formation, Record<FieldSector, number>> = {
  '3-1': { DEF: 3, MEI: 0, ATA: 1 },
  '2-2': { DEF: 2, MEI: 0, ATA: 2 },
  '2-1-1': { DEF: 2, MEI: 1, ATA: 1 },
  '1-2-1': { DEF: 1, MEI: 2, ATA: 1 },
};

export const FORMATION_DESCRIPTIONS: Record<Formation, string> = {
  '3-1': 'Defesa 3, ataque 1',
  '2-2': 'Defesa 2, ataque 2',
  '2-1-1': 'Defesa 2, meio 1, ataque 1',
  '1-2-1': 'Defesa 1, meio 2, ataque 1',
};

export const DEFAULT_FORMATION: Formation = '2-1-1';

export const LINEUP_SIZE = 5;

interface SectorInfo {
  label: string;
  hint: string;
  positions: Position[];
}

export const SECTORS: Record<Sector, SectorInfo> = {
  GOL: { label: 'Goleiro', hint: 'GOL', positions: ['GOL'] },
  DEF: { label: 'Defesa', hint: 'ZAG ou LAT', positions: ['ZAG', 'LAT'] },
  MEI: { label: 'Meio', hint: 'MEI', positions: ['MEI'] },
  ATA: { label: 'Ataque', hint: 'ATA', positions: ['ATA'] },
};

const SECTOR_ORDER: Sector[] = ['GOL', 'DEF', 'MEI', 'ATA'];

export interface Slot {
  key: string;
  sector: Sector;
  // Posição da vaga dentro do setor (0 é a primeira) e quantas vagas o setor tem.
  index: number;
  count: number;
}

// Vaga escolhida → id do titular; vaga ainda vazia não aparece.
export type Picks = Partial<Record<string, number>>;

export function sectorOf(position: Position): Sector {
  return SECTOR_ORDER.find((sector) =>
    SECTORS[sector].positions.includes(position),
  )!;
}

function countOf(formation: Formation, sector: Sector): number {
  return sector === 'GOL' ? 1 : FIELD_SECTORS[formation][sector];
}

// Vagas da formação: o goleiro e depois defesa, meio e ataque.
export function slotsOf(formation: Formation): Slot[] {
  return SECTOR_ORDER.flatMap((sector) => {
    const count = countOf(formation, sector);
    return Array.from({ length: count }, (_, index) => ({
      key: `${sector}-${index}`,
      sector,
      index,
      count,
    }));
  });
}

// Põe cada jogador na próxima vaga livre do setor dele, na ordem recebida; quem não cabe fica fora.
// Serve para abrir a escalação salva e para manter os escolhidos ao trocar de formação.
export function assignPlayers(formation: Formation, players: Player[]): Picks {
  const picks: Picks = {};
  for (const slot of slotsOf(formation)) {
    const player = players.filter(
      (candidate) => sectorOf(candidate.position) === slot.sector,
    )[slot.index];
    if (player) {
      picks[slot.key] = player.id;
    }
  }
  return picks;
}

// Se os jogadores que podem ser escalados (sem DOENTE) fecham ao menos uma formação.
export function fitsSomeFormation(players: Player[]): boolean {
  const available = (sector: Sector) =>
    players.filter((player) => sectorOf(player.position) === sector).length;
  return FORMATIONS.some((formation) =>
    SECTOR_ORDER.every(
      (sector) => available(sector) >= countOf(formation, sector),
    ),
  );
}

// RN20: os atributos que o titular usa na partida, pela posição dele.
export function usedAttributes(position: Position): (keyof PlayerAttributes)[] {
  switch (position) {
    case 'ATA':
      return ['shooting'];
    case 'MEI':
      return ['passing'];
    case 'LAT':
      return ['dribbling', 'defending'];
    default:
      return ['defending'];
  }
}
