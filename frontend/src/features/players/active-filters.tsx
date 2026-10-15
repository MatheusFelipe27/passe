import { X } from 'lucide-react';
import type { Club } from '@/api/clubs';
import { Button } from '@/components/ui/button';
import { listActiveFilters } from './active-filter-list';
import type { PlayerListState } from './use-player-list-state';

interface ActiveFiltersProps {
  state: PlayerListState;
  clubs: Club[] | undefined;
  onChange: (changes: Partial<PlayerListState>) => void;
}

export function ActiveFilters({ state, clubs, onChange }: ActiveFiltersProps) {
  const filters = listActiveFilters(state, clubs);
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">Filtros ativos:</span>
      {filters.map((filter) => (
        <span
          key={filter.label}
          className="flex items-center gap-1 rounded-md bg-muted py-0.5 pr-1 pl-2 text-xs font-medium"
        >
          {filter.label}
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-5"
            aria-label={`Remover filtro ${filter.label}`}
            onClick={() => onChange(filter.changes)}
          >
            <X aria-hidden className="size-3.5" />
          </Button>
        </span>
      ))}
      <Button
        variant="link"
        size="sm"
        onClick={() =>
          onChange(
            Object.assign({}, ...filters.map((filter) => filter.changes)),
          )
        }
      >
        Limpar filtros
      </Button>
    </div>
  );
}
