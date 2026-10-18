import { ChevronRight, Plus, Shield, Swords } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { cn } from 'cn';
import type { Club } from '@/api/clubs';
import { ApiError } from '@/api/http-client';
import type { MatchSummary } from '@/api/league';
import { DataTable, type Column } from '@/components/data-table';
import { RefusalAlert } from '@/components/dialog-notes';
import { OptionFilter } from '@/components/filters/option-filter';
import { EmptyState } from '@/components/list-states';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { useClubs } from '@/hooks/use-clubs';
import { useMatches } from '@/hooks/use-league';
import {
  formatDate,
  formatDateTime,
  formatInteger,
  formatTime,
} from '@/lib/format';
import { ResultBadge, Score, TeamName } from './match-cells';
import { isWinner } from './match-labels';
import { useNewMatchDialog } from './new-match-dialog-context';

// O filtro fica na URL com o nome do query param da API; valor fora do formato é ignorado.
const CLUB_PARAM = 'club_id';
const POSITIVE_ID = /^[1-9]\d*$/;

function matchColumns(acronymOf: (id: number) => string | undefined) {
  const columns: Column<MatchSummary>[] = [
    {
      key: 'played_at',
      header: 'Data e hora',
      cell: (match) => (
        <span className="flex items-baseline gap-2">
          {formatDate(match.played_at)}
          <span className="text-xs text-muted-foreground">
            {formatTime(match.played_at)}
          </span>
        </span>
      ),
    },
    {
      key: 'home',
      header: 'Mandante',
      align: 'right',
      cell: (match) => (
        <span className="flex justify-end">
          <TeamName
            side={match.home}
            acronym={acronymOf(match.home.club_id)}
            bold={isWinner(match, match.home)}
          />
        </span>
      ),
    },
    {
      key: 'score',
      header: 'Placar',
      className: 'text-center',
      cell: (match) => <Score match={match} />,
    },
    {
      key: 'away',
      header: 'Visitante',
      cell: (match) => (
        <TeamName
          side={match.away}
          acronym={acronymOf(match.away.club_id)}
          bold={isWinner(match, match.away)}
          reverse
        />
      ),
    },
    {
      key: 'result',
      header: 'Resultado',
      cell: (match) => <ResultBadge result={match.result} />,
    },
    {
      key: 'duels',
      header: '',
      align: 'right',
      cell: (match) => <DuelsLink match={match} />,
    },
  ];
  return columns;
}

// RN21: as partidas da mais recente para a mais antiga, na ordem devolvida pela API.
export function MatchesPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get(CLUB_PARAM) ?? '';
  const clubId = POSITIVE_ID.test(requested) ? Number(requested) : undefined;
  const all = useMatches();
  const matches = useMatches(clubId);
  const clubs = useClubs();
  const { openNewMatch } = useNewMatchDialog();

  const acronymOf = (id: number) =>
    clubs.data?.find((club) => club.id === id)?.acronym;
  const latest = all.data?.[0];
  const neverPlayed = all.data?.length === 0;
  const refusal =
    matches.error instanceof ApiError &&
    (matches.error.status === 400 || matches.error.status === 404)
      ? matches.error
      : undefined;

  function filterBy(value: string | undefined) {
    setParams(value === undefined ? {} : { [CLUB_PARAM]: value });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Swords}
        title="Partidas"
        description="Jogue partidas entre clubes com os 5 titulares escalados e acompanhe o histórico."
        actions={
          <Button onClick={openNewMatch}>
            <Plus aria-hidden />
            Nova partida
          </Button>
        }
      />
      {neverPlayed && clubId === undefined ? (
        <section className="rounded-xl border bg-card shadow-xs">
          <EmptyState
            icon={Swords}
            title="Nenhuma partida jogada"
            description="Escale os 5 titulares de dois clubes e jogue a primeira partida. O resultado aparece aqui e na classificação."
            action={
              <Button variant="outline" onClick={openNewMatch}>
                <Plus aria-hidden />
                Nova partida
              </Button>
            }
          />
        </section>
      ) : (
        <>
          {latest && <LatestMatch match={latest} acronymOf={acronymOf} />}
          <section
            aria-label="Histórico de partidas"
            className="overflow-hidden rounded-xl border bg-card shadow-xs"
          >
            <header className="flex items-start justify-between gap-4 border-b px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <h2 className="font-semibold">Histórico de partidas</h2>
                <p className="text-xs text-muted-foreground">
                  Da mais recente para a mais antiga.
                </p>
              </div>
              <OptionFilter
                icon={Shield}
                label="Clube"
                allLabel="Todos"
                showAllLabel
                options={clubOptions(clubs.data)}
                value={clubId?.toString()}
                onChange={filterBy}
              />
            </header>
            {refusal ? (
              <div className="flex flex-col items-start gap-3 p-4">
                <RefusalAlert
                  title="O filtro foi recusado"
                  message={refusal.message}
                />
                <Button variant="outline" onClick={() => filterBy(undefined)}>
                  Ver todas as partidas
                </Button>
              </div>
            ) : (
              <>
                <DataTable
                  columns={matchColumns(acronymOf)}
                  rows={matches.data}
                  rowKey={(match) => match.id}
                  isLoading={matches.isPending}
                  isRefreshing={matches.isPlaceholderData}
                  error={matches.error}
                  onRetry={() => void matches.refetch()}
                  errorTitle="Não foi possível carregar as partidas"
                  empty={{
                    icon: Swords,
                    title: 'Nenhuma partida deste clube',
                    description:
                      'O clube ainda não jogou como mandante nem como visitante.',
                    action: (
                      <Button
                        variant="outline"
                        onClick={() => filterBy(undefined)}
                      >
                        Ver todas as partidas
                      </Button>
                    ),
                  }}
                />
                {matches.data && matches.data.length > 0 && (
                  <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                    {matches.data.length === 1
                      ? '1 partida'
                      : `${formatInteger(matches.data.length)} partidas`}
                  </p>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function clubOptions(clubs: Club[] | undefined) {
  return (clubs ?? []).map((club) => ({
    value: String(club.id),
    label: club.name,
  }));
}

function DuelsLink({ match }: { match: MatchSummary }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link
        to={`/partidas/${match.id}`}
        aria-label={`Ver duelos de ${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}`}
      >
        Ver duelos
        <ChevronRight aria-hidden />
      </Link>
    </Button>
  );
}

function LatestMatch({
  match,
  acronymOf,
}: {
  match: MatchSummary;
  acronymOf: (id: number) => string | undefined;
}) {
  return (
    <section aria-label="Última partida" className="flex flex-col gap-2">
      <h2 className="text-sm text-muted-foreground">Última partida</h2>
      <div className="flex items-center rounded-xl border bg-card px-6 py-5 shadow-xs">
        <div className="flex flex-1 items-center justify-center gap-6">
          <LatestSide
            name={match.home.club_name}
            role="Mandante"
            acronym={acronymOf(match.home.club_id)}
          />
          <div className="flex flex-col items-center gap-1.5">
            <Score match={match} size="lg" />
            <span className="text-xs text-muted-foreground">
              {formatDateTime(match.played_at)}
            </span>
            <ResultBadge result={match.result} />
          </div>
          <LatestSide
            name={match.away.club_name}
            role="Visitante"
            acronym={acronymOf(match.away.club_id)}
            reverse
          />
        </div>
        <DuelsLink match={match} />
      </div>
    </section>
  );
}

function LatestSide({
  name,
  role,
  acronym,
  reverse = false,
}: {
  name: string;
  role: string;
  acronym: string | undefined;
  reverse?: boolean;
}) {
  const label = (
    <span className={reverse ? 'flex flex-col' : 'flex flex-col items-end'}>
      <span className="font-semibold">{name}</span>
      <span className="text-xs text-muted-foreground">{role}</span>
    </span>
  );
  const badge = acronym && (
    <span className="flex size-12 items-center justify-center rounded-xl border bg-muted text-sm font-semibold">
      {acronym}
    </span>
  );
  // No visitante, a sigla vem antes do nome, como no TeamName.
  return (
    <div
      className={cn(
        'flex flex-1 items-center gap-3',
        reverse ? 'justify-start' : 'justify-end',
      )}
    >
      {reverse ? badge : label}
      {reverse ? label : badge}
    </div>
  );
}
