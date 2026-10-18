import type {
  Condition,
  PlayerAttributes,
  PlayerSort,
  Position,
} from '@/api/players';

export const POSITIONS: Position[] = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'];

export const POSITION_NAMES: Record<Position, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  MEI: 'Meio-campo',
  ATA: 'Atacante',
};

export const CONDITIONS: Condition[] = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'];

export const CONDITION_NAMES: Record<Condition, string> = {
  APTO: 'Apto',
  MAL_CONDICIONADO: 'Mal condicionado',
  DOENTE: 'Doente',
};

export const SORT_NAMES: Record<PlayerSort, string> = {
  name: 'Nome',
  value_desc: 'Maior valor de mercado',
  value_asc: 'Menor valor de mercado',
  age_desc: 'Maior idade',
  age_asc: 'Menor idade',
  position: 'Posição (GOL a ATA)',
};

export const ATTRIBUTE_NAMES: Record<keyof PlayerAttributes, string> = {
  pace: 'Velocidade',
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  defending: 'Defesa',
  physical: 'Físico',
};

// Iniciais do avatar: a primeira letra do primeiro e do último nome.
export function initials(name: string): string {
  const words = name.split(' ');
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}
