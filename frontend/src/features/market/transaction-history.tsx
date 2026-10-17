import type { LucideIcon } from 'lucide-react';
import {
  Download,
  HandCoins,
  History,
  Loader2,
  Percent,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import { cn } from 'cn';
import { ApiError } from '@/api/http-client';
import type {
  Transaction,
  TransactionSummary,
  TransactionType,
} from '@/api/market';
import { DataTable, type Column } from '@/components/data-table';
import { RefusalAlert } from '@/components/dialog-notes';
import { OptionFilter } from '@/components/filters/option-filter';
import { SignedMoney } from '@/components/signed-money';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useExportTransactions, useTransactions } from '@/hooks/use-market';
import { useSubmitOnce } from '@/hooks/use-submit-once';
import { saveTextFile } from '@/lib/download';
import { formatDate, formatMoney, formatTime } from '@/lib/format';
import { notifyError, notifySuccess } from '@/lib/notify';
import { INITIAL_CASH } from '@/features/clubs/club-labels';
import { PlayerAvatar } from '@/features/players/player-cells';
import { TRANSACTION_TYPES, useHistoryFilters } from './use-history-filters';

const TYPE_LABELS: Record<TransactionType, string> = {
  COMPRA: 'Compra',
  VENDA: 'Venda',
};

const TYPE_ICONS: Record<TransactionType, LucideIcon> = {
  COMPRA: ShoppingCart,
  VENDA: HandCoins,
};

const NO_PROFIT = '–';

const COLUMNS: Column<Transaction>[] = [
  {
    key: 'created_at',
    header: 'Data e hora',
    cell: (transaction) => (
      <span className="flex items-baseline gap-2">
        {formatDate(transaction.created_at)}
        <span className="text-xs text-muted-foreground">
          {formatTime(transaction.created_at)}
        </span>
      </span>
    ),
  },
  {
    key: 'type',
    header: 'Tipo',
    cell: (transaction) => {
      const Icon = TYPE_ICONS[transaction.type];
      return (
        <Badge variant="outline" className="rounded-md">
          <Icon aria-hidden />
          {TYPE_LABELS[transaction.type]}
        </Badge>
      );
    },
  },
  {
    key: 'player',
    header: 'Jogador',
    className: 'whitespace-normal',
    cell: (transaction) => (
      <div className="flex items-center gap-3">
        <PlayerAvatar
          player={{ id: transaction.player_id, name: transaction.player_name }}
        />
        <span className="font-medium">{transaction.player_name}</span>
      </div>
    ),
  },
  {
    key: 'value',
    header: 'Valor',
    align: 'right',
    className: 'tabular-nums',
    cell: (transaction) => formatMoney(transaction.value),
  },
  {
    key: 'fee',
    header: 'Taxa ou comissão',
    align: 'right',
    className: 'tabular-nums',
    cell: (transaction) => formatMoney(transaction.fee),
  },
  {
    key: 'penalty',
    header: 'Multa',
    align: 'right',
    className: 'tabular-nums',
    cell: (transaction) => formatMoney(transaction.penalty),
  },
  {
    key: 'profit',
    header: 'Lucro',
    align: 'right',
    cell: (transaction) =>
      transaction.profit === null ? (
        <span className="text-muted-foreground">{NO_PROFIT}</span>
      ) : (
        <SignedMoney value={transaction.profit} />
      ),
  },
  {
    key: 'cash_change',
    header: 'Variação do caixa',
    align: 'right',
    cell: (transaction) => (
      <SignedMoney value={transaction.cash_change} className="font-semibold" />
    ),
  },
];

interface TransactionHistoryProps {
  clubId: string;
  clubCash: number | undefined;
}

// RN17 e RN18: as transações e os totais como a API devolveu, com os filtros e o CSV.
export function TransactionHistory({
  clubId,
  clubCash,
}: TransactionHistoryProps) {
  const { filters, apiFilters, hasFilters, update, clear } =
    useHistoryFilters();
  const everything = useTransactions(clubId, {});
  const history = useTransactions(clubId, apiFilters);
  const exportCsv = useExportTransactions();
  const submitOnce = useSubmitOnce();

  // O filtro por jogador lista quem aparece no histórico do clube.
  const playerOptions = [
    ...new Map(
      (everything.data?.data ?? []).map((transaction) => [
        transaction.player_id,
        transaction.player_name,
      ]),
    ),
  ]
    .map(([id, name]) => ({ value: String(id), label: name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  const playerName = playerOptions.find(
    (option) => option.value === String(filters.playerId),
  )?.label;

  const refusal =
    history.error instanceof ApiError &&
    (history.error.status === 400 || history.error.status === 404)
      ? history.error
      : undefined;

  function toggleType(type: TransactionType) {
    const types = filters.types.includes(type)
      ? filters.types.filter((item) => item !== type)
      : TRANSACTION_TYPES.filter(
          (item) => item === type || filters.types.includes(item),
        );
    update({ types });
  }

  function download() {
    void submitOnce(async () => {
      try {
        const file = await exportCsv.mutateAsync({
          clubId,
          filters: apiFilters,
        });
        const fileName = file.fileName ?? `historico-clube-${clubId}.csv`;
        saveTextFile(file.content, fileName, 'text/csv;charset=utf-8');
        notifySuccess(
          'CSV baixado',
          `${fileName}, ${describeFilters(filters.types, playerName)}.`,
        );
      } catch (error) {
        notifyError('Não foi possível exportar o CSV', error);
      }
    });
  }

  return (
    <section
      aria-label="Histórico de transações"
      className="overflow-hidden rounded-xl border bg-card shadow-xs"
    >
      <header className="flex flex-col gap-3 border-b px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-semibold">Histórico de transações</h2>
            <p className="text-xs text-muted-foreground">
              Da mais recente para a mais antiga, com o nome e os valores do
              momento de cada operação.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={exportCsv.isPending}
            onClick={download}
          >
            {exportCsv.isPending ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <Download aria-hidden />
            )}
            Exportar CSV
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Tipo</span>
          {TRANSACTION_TYPES.map((type) => (
            <TypeToggle
              key={type}
              label={TYPE_LABELS[type]}
              checked={filters.types.includes(type)}
              locked={filters.types.length === 1 && filters.types[0] === type}
              onChange={() => toggleType(type)}
            />
          ))}
          <span aria-hidden className="mx-1 h-6 w-px bg-border" />
          <OptionFilter
            icon={UserRound}
            label="Jogador"
            allLabel="Todos"
            showAllLabel
            options={playerOptions}
            value={filters.playerId?.toString()}
            onChange={(value) =>
              update({
                playerId: value === undefined ? undefined : Number(value),
              })
            }
          />
          {hasFilters && (
            <Button variant="link" onClick={clear}>
              Limpar filtros
            </Button>
          )}
        </div>
      </header>
      {refusal ? (
        <div className="p-4">
          <RefusalAlert
            title="O filtro foi recusado"
            message={refusal.message}
          />
        </div>
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            rows={history.data?.data}
            rowKey={(transaction) => transaction.id}
            isLoading={history.isPending}
            isRefreshing={history.isPlaceholderData}
            error={history.error}
            onRetry={() => void history.refetch()}
            errorTitle="Não foi possível carregar o histórico"
            empty={
              hasFilters
                ? {
                    icon: History,
                    title: 'Nenhuma transação com esses filtros',
                    description:
                      'Troque os filtros ou limpe-os para ver todo o histórico.',
                  }
                : {
                    icon: History,
                    title: 'Nenhuma transação ainda',
                    description:
                      'As compras e vendas do clube aparecem aqui, com os totais logo abaixo.',
                  }
            }
          />
          {history.data && <SummaryCards summary={history.data.summary} />}
        </>
      )}
      {history.data && !refusal && clubCash !== undefined && (
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">
          Os totais respeitam os filtros. {formatMoney(INITIAL_CASH)} + soma das
          variações = caixa atual ({formatMoney(clubCash)}).
        </p>
      )}
    </section>
  );
}

function TypeToggle({
  label,
  checked,
  locked,
  onChange,
}: {
  label: string;
  checked: boolean;
  locked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      title={locked ? 'Pelo menos um tipo fica marcado.' : undefined}
      className={cn(
        'flex h-9 items-center gap-2 rounded-lg border px-3 text-sm',
        checked
          ? 'border-primary bg-primary-soft text-primary'
          : 'border-input text-foreground',
        locked ? 'cursor-not-allowed' : 'cursor-pointer',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={onChange}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  );
}

const SUMMARY_CARDS: {
  key: keyof TransactionSummary;
  label: string;
  help: string;
  icon: LucideIcon;
}[] = [
  {
    key: 'total_spent',
    label: 'Total pago em compras',
    help: 'Valor + taxa',
    icon: ShoppingCart,
  },
  {
    key: 'total_received',
    label: 'Total recebido em vendas',
    help: 'Crédito líquido',
    icon: HandCoins,
  },
  {
    key: 'total_fees',
    label: 'Taxas e comissões',
    help: 'Somadas',
    icon: Percent,
  },
  {
    key: 'total_penalties',
    label: 'Multas',
    help: 'Por fidelidade',
    icon: TriangleAlert,
  },
  {
    key: 'total_profit',
    label: 'Lucro total',
    help: 'Soma dos lucros, com sinal',
    icon: TrendingUp,
  },
];

// RN17: os totais do summary devolvido pela API, que já respeitam os filtros.
function SummaryCards({ summary }: { summary: TransactionSummary }) {
  return (
    <dl className="grid grid-cols-5 divide-x border-t bg-muted-subtle">
      {SUMMARY_CARDS.map(({ key, label, help, icon: Icon }) => (
        <div key={key} className="flex flex-col gap-1 px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon aria-hidden className="size-3.5" />
            {label}
          </dt>
          <dd className="text-lg font-semibold">
            {key === 'total_profit' ? (
              <SignedMoney value={summary[key]} />
            ) : (
              <span className="tabular-nums">{formatMoney(summary[key])}</span>
            )}
          </dd>
          <span className="text-xs text-muted-foreground">{help}</span>
        </div>
      ))}
    </dl>
  );
}

function describeFilters(
  types: TransactionType[],
  playerName: string | undefined,
): string {
  const parts = [
    types.length < TRANSACTION_TYPES.length
      ? `tipo ${types.map((type) => TYPE_LABELS[type]).join(' e ')}`
      : undefined,
    playerName ? `jogador ${playerName}` : undefined,
  ].filter(Boolean);
  if (parts.length === 0) {
    return 'sem filtros';
  }
  return `com o filtro de ${parts.join(' e ')} aplicado`;
}
