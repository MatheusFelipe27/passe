import type { ClubSort } from '@/api/clubs';

// RN10: a liga aceita no máximo 20 clubes.
export const MAX_CLUBS = 20;

// RN14: o elenco tem no máximo 12 jogadores.
export const MAX_SQUAD = 12;

// RN10: o clube nasce com 300,00 em caixa.
export const INITIAL_CASH = 300;

export const CLUB_SORT_NAMES: Record<ClubSort, string> = {
  name: 'Nome',
  net_worth_desc: 'Patrimônio (maior para o menor)',
  net_worth_asc: 'Patrimônio (menor para o maior)',
};
