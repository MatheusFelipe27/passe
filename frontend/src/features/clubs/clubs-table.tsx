import { ChevronRight, Plus, Shield } from 'lucide-react';
import { Link } from 'react-router';
import type { Club } from '@/api/clubs';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/format';
import { ClubAvatar } from './club-cells';
import { INITIAL_CASH } from './club-labels';

interface ClubsTableProps {
  clubs: Club[] | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  onRetry: () => void;
  onCreate: () => void;
}

const COLUMNS: Column<Club>[] = [
  {
    key: 'name',
    header: 'Clube',
    cell: (club) => (
      <div className="flex items-center gap-3">
        <ClubAvatar acronym={club.acronym} />
        <span className="font-medium">{club.name}</span>
      </div>
    ),
  },
  {
    key: 'acronym',
    header: 'Sigla',
    cell: (club) => (
      <Badge variant="outline" className="rounded-md">
        {club.acronym}
      </Badge>
    ),
  },
  {
    key: 'cash',
    header: 'Caixa',
    align: 'right',
    className: 'tabular-nums',
    cell: (club) => formatMoney(club.cash),
  },
  {
    key: 'squad_value',
    header: 'Valor do elenco',
    align: 'right',
    className: 'tabular-nums',
    cell: (club) => formatMoney(club.squad_value),
  },
  {
    key: 'net_worth',
    header: 'Patrimônio',
    align: 'right',
    className: 'tabular-nums',
    cell: (club) => (
      <span className="font-semibold">{formatMoney(club.net_worth)}</span>
    ),
  },
  {
    key: 'open',
    header: '',
    align: 'right',
    cell: (club) => (
      <Button asChild variant="ghost" size="sm">
        <Link to={`/clubes/${club.id}`} aria-label={`Ver clube ${club.name}`}>
          Ver clube
          <ChevronRight aria-hidden />
        </Link>
      </Button>
    ),
  },
];

// Os clubes aparecem na ordem devolvida pela API, sem reordenar na tela.
export function ClubsTable({ clubs, onCreate, ...state }: ClubsTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      rows={clubs}
      rowKey={(club) => club.id}
      errorTitle="Não foi possível carregar os clubes"
      empty={{
        icon: Shield,
        title: 'Nenhum clube cadastrado',
        description: `Crie o primeiro clube com nome e sigla. Ele começa com ${formatMoney(INITIAL_CASH)} em caixa e sem jogadores.`,
        action: (
          <Button variant="outline" onClick={onCreate}>
            <Plus aria-hidden />
            Novo clube
          </Button>
        ),
      }}
      {...state}
    />
  );
}
