import { z } from 'zod';
import { Money, money } from '../../../common/money/money';
import { countCharacters } from '../../../common/text/text';
import {
  booleanParam,
  decimalParam,
  idParam,
  integerParam,
} from '../../../common/validation/query-params';
import { normalizedText } from '../../../common/validation/schemas';
import {
  CONDITIONS,
  Condition,
  POSITIONS,
  Position,
} from '../domain/player.types';

const SEARCH_MIN_LENGTH = 2;
const SEARCH_MAX_LENGTH = 100;
const MIN_AGE = 16;
const MAX_AGE = 45;
const MAX_VALUE = 550;
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;
const MAX_SORT_KEYS = 2;

export const PLAYER_SORT_KEYS = [
  'name',
  'value_asc',
  'value_desc',
  'age_asc',
  'age_desc',
  'position',
] as const;
export type PlayerSortKey = (typeof PLAYER_SORT_KEYS)[number];

const SORT_FIELD: Record<PlayerSortKey, string> = {
  name: 'name',
  value_asc: 'value',
  value_desc: 'value',
  age_asc: 'age',
  age_desc: 'age',
  position: 'position',
};

const searchParam = normalizedText().refine(
  (search) => {
    const length = countCharacters(search);
    return length >= SEARCH_MIN_LENGTH && length <= SEARCH_MAX_LENGTH;
  },
  {
    message: `deve ter de ${SEARCH_MIN_LENGTH} a ${SEARCH_MAX_LENGTH} caracteres`,
  },
);

// RN07: até dois critérios, separados por vírgula, sem espaços e sem repetir o campo.
const sortParam = z.string().transform((value, context) => {
  const keys = value.split(',');
  const isKnown = (key: string): key is PlayerSortKey =>
    (PLAYER_SORT_KEYS as readonly string[]).includes(key);
  const fields = new Set(keys.filter(isKnown).map((key) => SORT_FIELD[key]));
  if (
    keys.length > MAX_SORT_KEYS ||
    !keys.every(isKnown) ||
    fields.size !== keys.length
  ) {
    context.addIssue({
      code: 'custom',
      message: `deve ter até ${MAX_SORT_KEYS} critérios distintos entre ${PLAYER_SORT_KEYS.join(', ')}, separados por vírgula`,
    });
    return z.NEVER;
  }
  return keys;
});

export interface Range<T> {
  min: T;
  max: T;
}

export interface ListPlayersQuery {
  search?: string;
  position?: Position;
  condition?: Condition;
  free?: boolean;
  clubId?: number;
  age?: Range<number>;
  marketValue?: Range<Money>;
  sort: PlayerSortKey[];
  page: number;
  limit: number;
}

export const listPlayersQuerySchema = z
  .object({
    search: searchParam.optional(),
    position: z.enum(POSITIONS).optional(),
    condition: z.enum(CONDITIONS).optional(),
    free: booleanParam().optional(),
    club_id: idParam().optional(),
    min_age: integerParam(MIN_AGE, MAX_AGE).optional(),
    max_age: integerParam(MIN_AGE, MAX_AGE).optional(),
    min_value: decimalParam(MAX_VALUE).optional(),
    max_value: decimalParam(MAX_VALUE).optional(),
    sort: sortParam.optional(),
    page: integerParam(1).optional(),
    limit: integerParam(1, MAX_LIMIT).optional(),
  })
  .refine((query) => !(query.free === true && query.club_id !== undefined), {
    path: ['free'],
    message: 'free=true não pode ser combinado com club_id',
  })
  .refine((query) => (query.min_age ?? MIN_AGE) <= (query.max_age ?? MAX_AGE), {
    path: ['min_age'],
    message: 'não pode ser maior que max_age',
  })
  .refine(
    (query) =>
      query.min_value === undefined ||
      query.max_value === undefined ||
      query.min_value.lessThanOrEqualTo(query.max_value),
    { path: ['min_value'], message: 'não pode ser maior que max_value' },
  )
  .transform((query): ListPlayersQuery => ({
    search: query.search,
    position: query.position,
    condition: query.condition,
    free: query.free,
    clubId: query.club_id,
    age:
      query.min_age === undefined && query.max_age === undefined
        ? undefined
        : { min: query.min_age ?? MIN_AGE, max: query.max_age ?? MAX_AGE },
    marketValue:
      query.min_value === undefined && query.max_value === undefined
        ? undefined
        : {
            min: query.min_value ?? money(0),
            max: query.max_value ?? money(MAX_VALUE),
          },
    sort: query.sort ?? ['name'],
    page: query.page ?? 1,
    limit: query.limit ?? DEFAULT_LIMIT,
  }));
