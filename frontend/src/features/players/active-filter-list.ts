import type { Club } from '@/api/clubs';
import { describeRange } from '@/components/filters/describe-range';
import { CONDITION_NAMES } from './player-labels';
import { formatAge, formatMoneyText } from './range-parsers';
import type { PlayerListState } from './use-player-list-state';

interface ActiveFilter {
  label: string;
  changes: Partial<PlayerListState>;
}

export function hasActiveFilters(state: PlayerListState): boolean {
  return listActiveFilters(state, undefined).length > 0;
}

export function listActiveFilters(
  state: PlayerListState,
  clubs: Club[] | undefined,
): ActiveFilter[] {
  const filters: ActiveFilter[] = [];
  if (state.search?.trim()) {
    filters.push({
      label: `Busca: ${state.search.trim()}`,
      changes: { search: undefined },
    });
  }
  if (state.position) {
    filters.push({
      label: `Posição: ${state.position}`,
      changes: { position: undefined },
    });
  }
  if (state.condition) {
    filters.push({
      label: `Condição: ${CONDITION_NAMES[state.condition]}`,
      changes: { condition: undefined },
    });
  }
  if (state.clubId !== undefined) {
    const club = clubs?.find((item) => item.id === state.clubId);
    filters.push({
      label: `Clube: ${club?.name ?? state.clubId}`,
      changes: { clubId: undefined },
    });
  }
  const age = describeRange(state.age, formatAge);
  if (age) {
    filters.push({ label: `Idade: ${age}`, changes: { age: {} } });
  }
  const value = describeRange(state.value, formatMoneyText);
  if (value) {
    filters.push({
      label: `Valor de mercado: ${value}`,
      changes: { value: {} },
    });
  }
  return filters;
}
