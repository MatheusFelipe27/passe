import { useSearchParams } from 'react-router';
import type { TransactionFilters, TransactionType } from '@/api/market';

export const TRANSACTION_TYPES: TransactionType[] = ['COMPRA', 'VENDA'];

const INTEGER = /^[1-9]\d*$/;

export interface HistoryFilters {
  types: TransactionType[];
  playerId: number | undefined;
}

// Filtros do histórico na URL, com os nomes dos query params da API (type e player_id).
// Com os dois tipos marcados, o histórico não filtra por tipo.
export function useHistoryFilters() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);

  function update(changes: Partial<HistoryFilters>) {
    const next = { ...filters, ...changes };
    setParams((current) => {
      const result = new URLSearchParams(current);
      setOrDelete(result, 'type', toTypeParam(next.types));
      setOrDelete(result, 'player_id', next.playerId?.toString());
      return result;
    });
  }

  return {
    filters,
    apiFilters: toApiFilters(filters),
    hasFilters:
      filters.types.length < TRANSACTION_TYPES.length ||
      filters.playerId !== undefined,
    update,
    clear: () => update({ types: TRANSACTION_TYPES, playerId: undefined }),
  };
}

export function toApiFilters(filters: HistoryFilters): TransactionFilters {
  return {
    type: toTypeParam(filters.types),
    player_id: filters.playerId,
  };
}

function readFilters(params: URLSearchParams): HistoryFilters {
  const types = (params.get('type') ?? '')
    .split(',')
    .filter((type): type is TransactionType =>
      (TRANSACTION_TYPES as string[]).includes(type),
    );
  const playerId = params.get('player_id') ?? '';
  return {
    types:
      types.length > 0
        ? TRANSACTION_TYPES.filter((type) => types.includes(type))
        : TRANSACTION_TYPES,
    playerId: INTEGER.test(playerId) ? Number(playerId) : undefined,
  };
}

function toTypeParam(types: TransactionType[]): string | undefined {
  return types.length === TRANSACTION_TYPES.length
    ? undefined
    : types.join(',');
}

function setOrDelete(params: URLSearchParams, name: string, value?: string) {
  if (value === undefined) {
    params.delete(name);
  } else {
    params.set(name, value);
  }
}
