import {
  Coins,
  HeartPulse,
  Search,
  Shield,
  Shirt,
  UserRound,
} from 'lucide-react';
import type { Club } from '@/api/clubs';
import type { Condition, Position } from '@/api/players';
import { OptionFilter } from '@/components/filters/option-filter';
import { RangeFilter } from '@/components/filters/range-filter';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CONDITIONS, CONDITION_NAMES, POSITIONS } from './player-labels';
import {
  formatAge,
  formatMoneyText,
  parseAge,
  parseMoney,
} from './range-parsers';
import type { PlayerListState } from './use-player-list-state';

const FREE_WITH_CLUB_MESSAGE = '“Livres” não combina com o filtro por clube.';

interface PlayerFiltersProps {
  state: PlayerListState;
  clubs: Club[] | undefined;
  onChange: (
    changes: Partial<PlayerListState>,
    options?: { replace?: boolean },
  ) => void;
}

export function PlayerFilters({ state, clubs, onChange }: PlayerFiltersProps) {
  const clubFilterDisabled = state.situation === 'free';
  const clubFilter = (
    <OptionFilter
      icon={Shield}
      label="Clube"
      allLabel="Todos os clubes"
      options={(clubs ?? []).map((club) => ({
        value: String(club.id),
        label: club.name,
      }))}
      value={state.clubId === undefined ? undefined : String(state.clubId)}
      onChange={(clubId) =>
        onChange({ clubId: clubId === undefined ? undefined : Number(clubId) })
      }
      disabled={clubFilterDisabled}
    />
  );

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card p-2 shadow-xs">
      <SearchInput
        value={state.search}
        onSearch={(search) => onChange({ search }, { replace: true })}
      />
      <OptionFilter
        icon={Shirt}
        label="Posição"
        allLabel="Todas as posições"
        options={POSITIONS.map((position) => ({
          value: position,
          label: position,
        }))}
        value={state.position}
        onChange={(position) =>
          onChange({ position: position as Position | undefined })
        }
      />
      <OptionFilter
        icon={HeartPulse}
        label="Condição"
        allLabel="Todas as condições"
        options={CONDITIONS.map((condition) => ({
          value: condition,
          label: CONDITION_NAMES[condition],
        }))}
        value={state.condition}
        onChange={(condition) =>
          onChange({ condition: condition as Condition | undefined })
        }
      />
      {clubFilterDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>{clubFilter}</span>
          </TooltipTrigger>
          <TooltipContent>{FREE_WITH_CLUB_MESSAGE}</TooltipContent>
        </Tooltip>
      ) : (
        clubFilter
      )}
      <RangeFilter
        icon={UserRound}
        label="Idade"
        value={state.age}
        onChange={(age) => onChange({ age })}
        parse={parseAge}
        format={formatAge}
        placeholder={{ min: 'Ex.: 18', max: 'Ex.: 30' }}
      />
      <RangeFilter
        icon={Coins}
        label="Valor de mercado"
        value={state.value}
        onChange={(value) => onChange({ value })}
        parse={parseMoney}
        format={formatMoneyText}
        placeholder={{ min: 'Ex.: 10,00', max: 'Ex.: 60,00' }}
      />
    </div>
  );
}

function SearchInput({
  value,
  onSearch,
}: {
  value: string | undefined;
  onSearch: (search: string) => void;
}) {
  return (
    <div className="relative flex-1">
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        aria-label="Buscar jogador pelo nome"
        placeholder="Buscar por nome"
        value={value ?? ''}
        maxLength={100}
        onChange={(event) => onSearch(event.target.value)}
        className="pl-9"
      />
    </div>
  );
}
