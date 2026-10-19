import type { ReactNode } from 'react';
import { ArrowRight, ListOrdered, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from 'cn';
import type { Standing } from '@/api/league';
import { DataTable, type Column } from '@/components/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { useClubs } from '@/hooks/use-clubs';
import { useMatches, useStandings } from '@/hooks/use-league';
import { formatDateTime, formatSignedInteger } from '@/lib/format';
import { Score, TeamName } from './match-cells';
import { isWinner } from './match-labels';
import { useNewMatchDialog } from './new-match-dialog-context';

// RN21: os critérios de desempate, na ordem em que a API ordena a tabela.
const TIEBREAKERS = [
  'Mais pontos',
  'Maior saldo de gols',
  'Mais gols marcados',
  'Nome do clube, de A a Z',
];

const RECENT_MATCHES = 2;

const LEGEND =
  'J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols marcados · GC: gols sofridos · SG: saldo de gols · Pts: pontos';

function numberColumn(
  key: keyof Standing,
  header: string,
  label: string,
): Column<Standing> {
  return {
    key,
    header,
    align: 'right',
    className: 'tabular-nums',
    cell: (row) => <span title={label}>{row[key]}</span>,
  };
}

function standingColumns(acronymOf: (id: number) => string | undefined) {
  const columns: Column<Standing>[] = [
    {
      key: 'position',
      header: '#',
      cell: (row) => (
        <span
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md text-xs font-semibold tabular-nums',
            row.position === 1
              ? 'bg-primary text-primary-foreground'
              : 'border bg-muted-subtle',
          )}
        >
          {row.position}
        </span>
      ),
    },
    {
      key: 'club',
      header: 'Clube',
      className: 'whitespace-normal',
      cell: (row) => (
        <span className="flex items-center gap-2">
          {acronymOf(row.club_id) && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium">
              {acronymOf(row.club_id)}
            </span>
          )}
          <Link
            to={`/clubes/${row.club_id}`}
            className="font-medium underline underline-offset-4"
          >
            {row.club_name}
          </Link>
        </span>
      ),
    },
    numberColumn('played', 'J', 'Jogos'),
    numberColumn('wins', 'V', 'Vitórias'),
    numberColumn('draws', 'E', 'Empates'),
    numberColumn('losses', 'D', 'Derrotas'),
    numberColumn('goals_for', 'GP', 'Gols marcados'),
    numberColumn('goals_against', 'GC', 'Gols sofridos'),
    {
      key: 'goal_difference',
      header: 'SG',
      align: 'right',
      className: 'tabular-nums',
      cell: (row) => (
        <span title="Saldo de gols">
          {formatSignedInteger(row.goal_difference)}
        </span>
      ),
    },
    {
      key: 'points',
      header: 'Pts',
      align: 'right',
      className: 'font-semibold tabular-nums',
      cell: (row) => <span title="Pontos">{row.points}</span>,
    },
  ];
  return columns;
}

// RN21: a tabela na ordem devolvida pela API; pontos, saldo e posição não são recalculados.
export function StandingsPage() {
  const standings = useStandings();
  const clubs = useClubs();
  const { openNewMatch } = useNewMatchDialog();
  const acronymOf = (id: number) =>
    clubs.data?.find((club) => club.id === id)?.acronym;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ListOrdered}
        title="Classificação"
        description="Todos os clubes, com 3 pontos por vitória e 1 por empate."
        actions={
          <Button variant="outline" onClick={openNewMatch}>
            <Plus aria-hidden />
            Nova partida
          </Button>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-6">
        <section
          aria-label="Classificação"
          className="overflow-hidden rounded-xl border bg-card shadow-xs"
        >
          <DataTable
            columns={standingColumns(acronymOf)}
            rows={standings.data}
            rowKey={(row) => row.club_id}
            isLoading={standings.isPending}
            error={standings.error}
            onRetry={() => void standings.refetch()}
            errorTitle="Não foi possível carregar a classificação"
            empty={{
              icon: ListOrdered,
              title: 'Nenhum clube cadastrado',
              description:
                'A classificação mostra todos os clubes, mesmo os que ainda não jogaram.',
            }}
          />
          {standings.data && standings.data.length > 0 && (
            <p className="border-t px-4 py-3 text-xs text-muted-foreground">
              {LEGEND}
            </p>
          )}
        </section>
        <div className="flex flex-col gap-6">
          <RecentMatches />
          <SidePanel
            title="Ordem da tabela"
            description="Critérios de classificação, nesta ordem."
          >
            <ol className="flex flex-col gap-3 px-5 py-4">
              {TIEBREAKERS.map((criterion, index) => (
                <li key={criterion} className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted-subtle text-xs font-medium">
                    {index + 1}
                  </span>
                  {criterion}
                </li>
              ))}
            </ol>
          </SidePanel>
        </div>
      </div>
    </div>
  );
}

// Extra do mockup (opcional no enunciado): as partidas mais recentes, como a API listou.
function RecentMatches() {
  const matches = useMatches();
  const recent = matches.data?.slice(0, RECENT_MATCHES) ?? [];
  return (
    <SidePanel
      title="Últimas partidas"
      description="Da mais recente para a mais antiga."
    >
      <div className="flex flex-col gap-4 px-5 py-4">
        {matches.isPending ? (
          <span className="text-sm text-muted-foreground">Carregando…</span>
        ) : matches.error ? (
          <span className="text-sm text-muted-foreground">
            Não foi possível carregar as partidas.
          </span>
        ) : recent.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            Nenhuma partida jogada ainda.
          </span>
        ) : (
          <ul aria-label="Últimas partidas" className="flex flex-col gap-4">
            {recent.map((match) => (
              <li key={match.id} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(match.played_at)}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-sm">
                  <TeamName
                    side={match.home}
                    acronym={undefined}
                    bold={isWinner(match, match.home)}
                  />
                  <Score match={match} />
                  <TeamName
                    side={match.away}
                    acronym={undefined}
                    bold={isWinner(match, match.away)}
                    reverse
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/partidas"
          className="flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          Ver todas as partidas
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </SidePanel>
  );
}

function SidePanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="overflow-hidden rounded-xl border bg-card shadow-xs"
    >
      <header className="flex flex-col gap-0.5 border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}
