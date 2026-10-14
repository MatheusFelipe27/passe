import { Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { PaginationBar } from '@/components/pagination-bar';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useClubs } from '@/hooks/use-league';
import { usePlayers } from '@/hooks/use-players';
import { hasActiveFilters } from './active-filter-list';
import { ActiveFilters } from './active-filters';
import { PlayerFilters } from './player-filters';
import { PlayersTable } from './players-table';
import { SituationTabs } from './situation-tabs';
import { SortMenu } from './sort-menu';
import {
  PAGE_SIZE,
  situationFilter,
  toPlayerFilters,
  usePlayerListState,
} from './use-player-list-state';

const SEARCH_DELAY_MS = 300;
const COUNT_ONLY = { limit: 1 };

export function PlayersPage() {
  const { state, update } = usePlayerListState();
  const search = useDebouncedValue(state.search?.trim() ?? '', SEARCH_DELAY_MS);
  const filters = toPlayerFilters(state, search);
  const clubs = useClubs();

  const list = usePlayers({
    ...filters,
    free: situationFilter(state.situation),
    sort: state.sort,
    page: state.page,
    limit: PAGE_SIZE,
  });
  const allCount = usePlayers({ ...filters, ...COUNT_ONLY });
  const freeCount = usePlayers(
    { ...filters, ...COUNT_ONLY, free: true },
    { enabled: state.clubId === undefined },
  );
  const clubCount = usePlayers({ ...filters, ...COUNT_ONLY, free: false });

  const meta = list.data?.meta;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Users}
        title="Jogadores"
        description="Cadastre jogadores, acompanhe os indicadores e compre os que estão livres."
      />
      <PlayerFilters state={state} clubs={clubs.data} onChange={update} />
      <ActiveFilters state={state} clubs={clubs.data} onChange={update} />
      <section
        aria-label="Lista de jogadores"
        className="overflow-hidden rounded-xl border bg-card shadow-xs"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <SituationTabs
            value={state.situation}
            counts={{
              all: allCount.data?.meta.total_items,
              free:
                state.clubId === undefined
                  ? freeCount.data?.meta.total_items
                  : undefined,
              club: clubCount.data?.meta.total_items,
            }}
            freeDisabled={state.clubId !== undefined}
            onChange={(situation) => update({ situation })}
          />
          <SortMenu value={state.sort} onChange={(sort) => update({ sort })} />
        </div>
        <PlayersTable
          players={list.data?.data}
          clubs={clubs.data}
          isLoading={list.isPending}
          isRefreshing={list.isPlaceholderData}
          error={list.error}
          onRetry={() => void list.refetch()}
          hasFilters={hasActiveFilters(state) || state.situation !== 'all'}
        />
        {meta && !list.error && meta.total_items > 0 && (
          <PaginationBar
            page={meta.page}
            limit={meta.limit}
            totalItems={meta.total_items}
            totalPages={meta.total_pages}
            itemLabel={{ singular: 'jogador', plural: 'jogadores' }}
            onPageChange={(page) => update({ page })}
          />
        )}
      </section>
      <p className="text-xs text-muted-foreground">
        Overall e valor de mercado são calculados a cada consulta. A busca
        ignora maiúsculas, minúsculas e acentos.
      </p>
    </div>
  );
}
