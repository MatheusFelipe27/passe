import { HandCoins, Shirt, Users } from 'lucide-react';
import { Link } from 'react-router';
import type { RosterPlayer } from '@/api/clubs';
import { DataTable, type Column } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
  formatDate,
  formatInteger,
  formatMoney,
  formatTime,
} from '@/lib/format';
import {
  ConditionBadge,
  PlayerAvatar,
  PositionBadge,
} from '@/features/players/player-cells';
import { PenaltyBadge } from './club-cells';
import { MAX_SQUAD } from './club-labels';

const NO_CONTRACT = '–';

const COLUMNS: Column<RosterPlayer>[] = [
  {
    key: 'name',
    header: 'Jogador',
    cell: (player) => (
      <div className="flex items-center gap-3">
        <PlayerAvatar player={player} />
        <span className="font-medium">{player.name}</span>
      </div>
    ),
  },
  {
    key: 'position',
    header: 'Posição',
    cell: (player) => <PositionBadge position={player.position} />,
  },
  {
    key: 'overall',
    header: 'Overall',
    align: 'right',
    cell: (player) => <span className="font-semibold">{player.overall}</span>,
  },
  {
    key: 'condition',
    header: 'Condição',
    cell: (player) => <ConditionBadge condition={player.condition} />,
  },
  {
    key: 'market_value',
    header: 'Valor de mercado',
    align: 'right',
    className: 'tabular-nums',
    cell: (player) => (
      <span className="font-semibold">{formatMoney(player.market_value)}</span>
    ),
  },
  {
    key: 'purchase_value',
    header: 'Valor de compra',
    align: 'right',
    className: 'text-muted-foreground tabular-nums',
    cell: ({ contract }) =>
      contract ? formatMoney(contract.purchase_value) : NO_CONTRACT,
  },
  {
    key: 'loyalty_until',
    header: 'Fim da fidelidade',
    cell: ({ contract }) =>
      contract ? (
        <div className="flex flex-col">
          <span>{formatDate(contract.loyalty_until)}</span>
          <span className="text-xs text-muted-foreground">
            {formatTime(contract.loyalty_until)}
          </span>
        </div>
      ) : (
        NO_CONTRACT
      ),
  },
  {
    key: 'remaining_days',
    header: 'Dias restantes',
    align: 'right',
    className: 'tabular-nums',
    cell: ({ contract }) =>
      contract ? formatInteger(contract.remaining_days) : NO_CONTRACT,
  },
  {
    key: 'penalty_rate',
    header: '% de multa',
    cell: ({ contract }) =>
      contract ? <PenaltyBadge rate={contract.penalty_rate} /> : NO_CONTRACT,
  },
];

interface RosterTableProps {
  players: RosterPlayer[] | undefined;
  onSell: (player: RosterPlayer) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  onRetry: () => void;
}

// Elenco na ordem devolvida pela API (RN11), com o contrato calculado para uma venda agora.
export function RosterTable({ players, onSell, ...state }: RosterTableProps) {
  const columns: Column<RosterPlayer>[] = [
    ...COLUMNS,
    {
      key: 'sell',
      header: '',
      align: 'right',
      cell: (player) => (
        <Button
          variant="outline"
          size="sm"
          aria-label={`Vender ${player.name}`}
          onClick={() => onSell(player)}
        >
          <HandCoins aria-hidden />
          Vender
        </Button>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={players}
      rowKey={(player) => player.id}
      errorTitle="Não foi possível carregar o elenco"
      empty={{
        icon: Shirt,
        title: 'Nenhum jogador no elenco',
        description: `Compre jogadores livres para montar o elenco. O limite é de ${MAX_SQUAD} jogadores, e o custo de cada compra não pode passar de 50% do caixa.`,
        action: (
          <Button asChild variant="outline">
            <Link to="/jogadores?free=true">
              <Users aria-hidden />
              Ver jogadores livres
            </Link>
          </Button>
        ),
      }}
      {...state}
    />
  );
}
