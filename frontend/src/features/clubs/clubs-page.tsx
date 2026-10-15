import { Plus, Shield } from 'lucide-react';
import { useSearchParams } from 'react-router';
import type { ClubSort } from '@/api/clubs';
import { PageHeader } from '@/components/layout/page-header';
import { SortMenu } from '@/components/sort-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClubs } from '@/hooks/use-clubs';
import { formatInteger, formatMoney, pluralize } from '@/lib/format';
import { CLUB_SORT_NAMES, INITIAL_CASH, MAX_CLUBS } from './club-labels';
import { ClubsTable } from './clubs-table';
import { useNewClubDialog } from './new-club-dialog-context';

const CLUB_SORTS = Object.keys(CLUB_SORT_NAMES) as ClubSort[];

export function ClubsPage() {
  const [params, setParams] = useSearchParams();
  const sort = CLUB_SORTS.find((item) => item === params.get('sort')) ?? 'name';
  const clubs = useClubs(sort);
  const { openNewClub } = useNewClubDialog();
  const count = clubs.data?.length ?? 0;

  function changeSort(next: ClubSort) {
    setParams(next === 'name' ? {} : { sort: next });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Shield}
        title="Clubes"
        description={`Cada clube começa com ${formatMoney(INITIAL_CASH)} em caixa e sem jogadores. A liga aceita no máximo ${MAX_CLUBS} clubes.`}
        actions={
          <Button onClick={openNewClub}>
            <Plus aria-hidden />
            Novo clube
          </Button>
        }
      />
      <section
        aria-label="Lista de clubes"
        className="overflow-hidden rounded-xl border bg-card shadow-xs"
      >
        {count > 0 && (
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {formatInteger(count)} {pluralize(count, 'clube', 'clubes')}
              </span>
              <Badge variant="secondary" className="rounded-md">
                {formatInteger(count)} de {MAX_CLUBS}
              </Badge>
            </div>
            <SortMenu
              value={sort}
              options={CLUB_SORT_NAMES}
              onChange={changeSort}
            />
          </div>
        )}
        <ClubsTable
          clubs={clubs.data}
          isLoading={clubs.isPending}
          isRefreshing={clubs.isPlaceholderData}
          error={clubs.error}
          onRetry={() => void clubs.refetch()}
          onCreate={openNewClub}
        />
      </section>
      {count > 0 && (
        <p className="text-xs text-muted-foreground">
          Clubes pelo nome por padrão ou pelo patrimônio, com empate desfeito
          pelo nome.
        </p>
      )}
    </div>
  );
}
