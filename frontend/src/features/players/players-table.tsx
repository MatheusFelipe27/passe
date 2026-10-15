import { useMemo } from 'react';
import type { Club } from '@/api/clubs';
import type { Player } from '@/api/players';
import { DataTable, type Column } from '@/components/data-table';
import { formatMoney } from '@/lib/format';
import {
  AgilityBar,
  ConditionBadge,
  PlayerClub,
  PlayerIdentity,
  PositionBadge,
} from './player-cells';
import { PlayerRowActions, type PlayerAction } from './player-row-actions';

interface PlayersTableProps {
  players: Player[] | undefined;
  clubs: Club[] | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  onRetry: () => void;
  hasFilters: boolean;
  onAction: (action: PlayerAction, player: Player) => void;
}

export function PlayersTable({
  players,
  clubs,
  hasFilters,
  onAction,
  ...state
}: PlayersTableProps) {
  const clubsById = useMemo(
    () => new Map((clubs ?? []).map((club) => [club.id, club])),
    [clubs],
  );

  const columns: Column<Player>[] = [
    {
      key: 'name',
      header: 'Jogador',
      cell: (player) => <PlayerIdentity player={player} />,
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
      key: 'agility',
      header: 'Agilidade',
      align: 'right',
      cell: (player) => <AgilityBar agility={player.agility} />,
    },
    {
      key: 'age',
      header: 'Idade',
      align: 'right',
      cell: (player) => player.age,
    },
    {
      key: 'condition',
      header: 'Condição',
      cell: (player) => <ConditionBadge condition={player.condition} />,
    },
    {
      key: 'base_value',
      header: 'Valor base',
      align: 'right',
      className: 'text-muted-foreground tabular-nums',
      cell: (player) => formatMoney(player.base_value),
    },
    {
      key: 'market_value',
      header: 'Valor de mercado',
      align: 'right',
      className: 'tabular-nums',
      cell: (player) => (
        <span className="font-semibold">
          {formatMoney(player.market_value)}
        </span>
      ),
    },
    {
      key: 'club',
      header: 'Clube',
      cell: (player) => (
        <PlayerClub clubId={player.club_id} clubs={clubsById} />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (player) => (
        <PlayerRowActions player={player} onAction={onAction} />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={players}
      rowKey={(player) => player.id}
      errorTitle="Não foi possível carregar os jogadores"
      empty={
        hasFilters
          ? {
              title: 'Nenhum jogador encontrado',
              description: 'Nenhum jogador atende a todos os filtros.',
            }
          : {
              title: 'Nenhum jogador cadastrado',
              description: 'Com o banco recém-criado, a lista começa vazia.',
            }
      }
      {...state}
    />
  );
}
