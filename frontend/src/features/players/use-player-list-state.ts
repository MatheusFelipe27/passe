import { useSearchParams } from 'react-router';
import type {
  Condition,
  PlayerFilters,
  PlayerSort,
  Position,
} from '@/api/players';
import { CONDITIONS, POSITIONS, SORT_NAMES } from './player-labels';

export const PAGE_SIZE = 10;

export type ClubSituation = 'all' | 'free' | 'club';

export interface Range {
  min?: string;
  max?: string;
}

// Estado da lista de jogadores, guardado na URL com os mesmos nomes dos query params da API.
export interface PlayerListState {
  search?: string;
  position?: Position;
  condition?: Condition;
  situation: ClubSituation;
  clubId?: number;
  age: Range;
  value: Range;
  sort: PlayerSort;
  page: number;
}

export function usePlayerListState() {
  const [params, setParams] = useSearchParams();
  const state = readState(params);

  function update(
    changes: Partial<PlayerListState>,
    { replace = false }: { replace?: boolean } = {},
  ) {
    setParams(writeState({ ...state, page: 1, ...changes }), { replace });
  }

  return { state, update };
}

const SEARCH_MIN_LENGTH = 2;

// A API aceita busca de 2 a 100 caracteres: com menos, a busca não é enviada.
export function toPlayerFilters(
  state: PlayerListState,
  search: string,
): PlayerFilters {
  return {
    search: search.length >= SEARCH_MIN_LENGTH ? search : undefined,
    position: state.position,
    condition: state.condition,
    club_id: state.clubId,
    min_age: toNumber(state.age.min),
    max_age: toNumber(state.age.max),
    min_value: state.value.min,
    max_value: state.value.max,
  };
}

export function situationFilter(situation: ClubSituation): boolean | undefined {
  if (situation === 'all') {
    return undefined;
  }
  return situation === 'free';
}

function readState(params: URLSearchParams): PlayerListState {
  const free = params.get('free');
  const page = Number(params.get('page'));
  return {
    search: params.get('search') ?? undefined,
    position: oneOf(params.get('position'), POSITIONS),
    condition: oneOf(params.get('condition'), CONDITIONS),
    situation: free === 'true' ? 'free' : free === 'false' ? 'club' : 'all',
    clubId: toNumber(params.get('club_id') ?? undefined),
    age: {
      min: params.get('min_age') ?? undefined,
      max: params.get('max_age') ?? undefined,
    },
    value: {
      min: params.get('min_value') ?? undefined,
      max: params.get('max_value') ?? undefined,
    },
    sort:
      oneOf(params.get('sort'), Object.keys(SORT_NAMES) as PlayerSort[]) ??
      'name',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function writeState(state: PlayerListState): URLSearchParams {
  const entries: [string, string | number | boolean | undefined][] = [
    ['search', state.search],
    ['position', state.position],
    ['condition', state.condition],
    ['free', situationFilter(state.situation)],
    ['club_id', state.clubId],
    ['min_age', state.age.min],
    ['max_age', state.age.max],
    ['min_value', state.value.min],
    ['max_value', state.value.max],
    ['sort', state.sort === 'name' ? undefined : state.sort],
    ['page', state.page === 1 ? undefined : state.page],
  ];
  const params = new URLSearchParams();
  for (const [name, value] of entries) {
    if (value !== undefined && value !== '') {
      params.set(name, String(value));
    }
  }
  return params;
}

function oneOf<T extends string>(
  value: string | null,
  options: readonly T[],
): T | undefined {
  return options.find((option) => option === value);
}

function toNumber(value: string | undefined): number | undefined {
  return value === undefined || value === '' ? undefined : Number(value);
}
