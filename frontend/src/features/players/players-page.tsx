import { Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { PaginationBar } from '@/components/pagination-bar';
import { SortMenu } from '@/components/sort-menu';
import { Button } from '@/components/ui/button';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useClubs } from '@/hooks/use-clubs';
import { usePlayers } from '@/hooks/use-players';
import { hasActiveFilters } from './active-filter-list';
import { ActiveFilters } from './active-filters';
import { ConditionDialog } from './condition-dialog';
import { DeletePlayerDialog } from './delete-player-dialog';
import { EditPlayerDialog } from './edit-player-dialog';
import { NewPlayerDialog } from './new-player-dialog';
import { PlayerCreatedDialog } from './player-created-dialog';
import { PlayerDetailsSheet } from './player-details-sheet';
import { PlayerFilters } from './player-filters';
import { SORT_NAMES } from './player-labels';
import { PlayersTable } from './players-table';
import { SituationTabs } from './situation-tabs';

import { usePlayerDialogs } from './use-player-dialogs';
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
  const dialogs = usePlayerDialogs();

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
        actions={
          <Button onClick={dialogs.openCreate}>
            <Plus aria-hidden />
            Novo jogador
          </Button>
        }
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
          <SortMenu
            value={state.sort}
            options={SORT_NAMES}
            onChange={(sort) => update({ sort })}
          />
        </div>
        <PlayersTable
          players={list.data?.data}
          clubs={clubs.data}
          isLoading={list.isPending}
          isRefreshing={list.isPlaceholderData}
          error={list.error}
          onRetry={() => void list.refetch()}
          hasFilters={hasActiveFilters(state) || state.situation !== 'all'}
          onAction={dialogs.openAction}
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
      <NewPlayerDialog
        open={dialogs.isCreating}
        onOpenChange={(open) => !open && dialogs.close()}
        onCreated={dialogs.showCreated}
      />
      <PlayerCreatedDialog
        player={dialogs.createdPlayer}
        onClose={dialogs.close}
        onShowDetails={(player) => dialogs.openAction('details', player)}
      />
      <PlayerDetailsSheet
        playerId={dialogs.detailsPlayerId}
        clubs={clubs.data}
        onClose={dialogs.close}
        onEdit={(player) => dialogs.openAction('edit', player)}
        onChangeCondition={(player) => dialogs.openAction('condition', player)}
      />
      <EditPlayerDialog
        player={dialogs.editingPlayer}
        onClose={dialogs.close}
      />
      <ConditionDialog
        player={dialogs.conditionPlayer}
        onClose={dialogs.close}
      />
      <DeletePlayerDialog
        player={dialogs.deletingPlayer}
        onClose={dialogs.close}
      />
    </div>
  );
}
