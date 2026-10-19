import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ClipboardList,
  Coins,
  History,
  Landmark,
  SearchX,
  Shirt,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router';
import type { ClubDetail, RosterPlayer } from '@/api/clubs';
import { ApiError } from '@/api/http-client';
import type { Sale } from '@/api/market';
import { EmptyState } from '@/components/list-states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClub } from '@/hooks/use-clubs';
import { useTransactions } from '@/hooks/use-market';
import {
  formatDate,
  formatInteger,
  formatMoney,
  formatTime,
} from '@/lib/format';
import { SaleResultDialog } from '@/features/market/sale-result-dialog';
import { SellPlayerDialog } from '@/features/market/sell-player-dialog';
import { TransactionHistory } from '@/features/market/transaction-history';
import { LineupTab } from '@/features/league/lineup-tab';
import { ClubAvatar } from './club-cells';
import { MAX_SQUAD } from './club-labels';
import { RosterTable } from './roster-table';

// RN15: a multa da venda é limitada a 10,00.
const PENALTY_CAP = 10;

// A aba aberta fica na URL (?tab=escalacao ou ?tab=historico), junto com os filtros do histórico.
const ROSTER_TAB = 'elenco';
const LINEUP_TAB = 'escalacao';
const HISTORY_TAB = 'historico';
const TABS = [ROSTER_TAB, LINEUP_TAB, HISTORY_TAB];

export function ClubPage() {
  const { id = '' } = useParams();
  const club = useClub(id);
  const [selling, setSelling] = useState<RosterPlayer>();
  const [sale, setSale] = useState<{ result: Sale; wasStarter: boolean }>();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab') ?? ROSTER_TAB;
  const tab = TABS.includes(requestedTab) ? requestedTab : ROSTER_TAB;
  const transactions = useTransactions(id, {});

  if (club.error instanceof ApiError && club.error.status === 404) {
    return (
      <section className="rounded-xl border bg-card shadow-xs">
        <EmptyState
          icon={SearchX}
          title="Clube não encontrado"
          description={`${club.error.message} O endereço pode estar errado ou o clube não existe.`}
          action={
            <Button asChild variant="outline">
              <Link to="/clubes">
                <ArrowLeft aria-hidden />
                Voltar para clubes
              </Link>
            </Button>
          }
        />
      </section>
    );
  }

  const players = club.data?.players;
  const hasPlayers = players !== undefined && players.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {club.data && (
        <>
          <ClubHeader club={club.data} />
          <ClubStats club={club.data} />
        </>
      )}
      <Tabs
        value={tab}
        onValueChange={(next) =>
          setParams(next === ROSTER_TAB ? {} : { tab: next })
        }
        className="gap-6"
      >
        <TabsList variant="line" className="w-full justify-start border-b">
          <TabsTrigger value={ROSTER_TAB} className="flex-none px-3">
            <Shirt aria-hidden />
            Elenco
            {players && <TabCount count={players.length} />}
          </TabsTrigger>
          <TabsTrigger value={LINEUP_TAB} className="flex-none px-3">
            <ClipboardList aria-hidden />
            Escalação
          </TabsTrigger>
          <TabsTrigger value={HISTORY_TAB} className="flex-none px-3">
            <History aria-hidden />
            Histórico
            {transactions.data && (
              <TabCount count={transactions.data.data.length} />
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={ROSTER_TAB} className="flex flex-col gap-6">
          <section
            aria-label="Elenco"
            className="overflow-hidden rounded-xl border bg-card shadow-xs"
          >
            {hasPlayers && (
              <header className="flex flex-col gap-0.5 border-b px-4 py-3">
                <h2 className="font-semibold">Elenco</h2>
                <p className="text-xs text-muted-foreground">
                  Ordem por posição (GOL, ZAG, LAT, MEI, ATA), depois pelo nome.
                  Contrato calculado para uma venda agora.
                </p>
              </header>
            )}
            <RosterTable
              players={players}
              isLoading={club.isPending}
              isRefreshing={club.isFetching && !club.isPending}
              error={club.error}
              onRetry={() => void club.refetch()}
              onSell={setSelling}
            />
          </section>
          {hasPlayers && (
            <p className="text-xs text-muted-foreground">
              Valor de mercado, dias restantes e % de multa calculados pela API
              para uma venda agora ({formatDate(club.dataUpdatedAt)},{' '}
              {formatTime(club.dataUpdatedAt)}). A multa tem teto de{' '}
              {formatMoney(PENALTY_CAP)}.
            </p>
          )}
        </TabsContent>
        <TabsContent value={LINEUP_TAB}>
          <LineupTab
            clubId={id}
            club={club.data}
            clubError={club.error}
            reloadClub={() => club.refetch()}
          />
        </TabsContent>
        <TabsContent value={HISTORY_TAB}>
          <TransactionHistory clubId={id} clubCash={club.data?.cash} />
        </TabsContent>
      </Tabs>
      <SellPlayerDialog
        player={selling}
        clubName={club.data?.name ?? ''}
        onClose={() => setSelling(undefined)}
        onSold={(result, wasStarter) => {
          setSelling(undefined);
          setSale({ result, wasStarter });
        }}
      />
      <SaleResultDialog
        sale={sale?.result}
        wasStarter={sale?.wasStarter ?? false}
        clubName={club.data?.name ?? ''}
        onClose={() => setSale(undefined)}
        onShowHistory={() => {
          setSale(undefined);
          setParams({ tab: HISTORY_TAB });
        }}
      />
    </div>
  );
}

function TabCount({ count }: { count: number }) {
  return (
    <Badge
      variant="secondary"
      className="rounded-md bg-primary-soft text-primary"
    >
      {formatInteger(count)}
    </Badge>
  );
}

function ClubHeader({ club }: { club: ClubDetail }) {
  return (
    <div className="flex items-center gap-4">
      <ClubAvatar acronym={club.acronym} size="lg" />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl leading-8 font-semibold tracking-[-0.025em]">
          {club.name}
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-md">
            Sigla {club.acronym}
          </Badge>
          <Badge variant="outline" className="rounded-md">
            <Shirt aria-hidden />
            {formatInteger(club.players.length)} de {MAX_SQUAD} jogadores
          </Badge>
        </div>
      </div>
      <Button asChild className="ml-auto">
        <Link to="/jogadores?free=true">
          <ShoppingCart aria-hidden />
          Comprar jogadores
        </Link>
      </Button>
    </div>
  );
}

function ClubStats({ club }: { club: ClubDetail }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        label="Caixa"
        icon={Wallet}
        value={formatMoney(club.cash)}
        unit="moedas"
        help="Só muda por compras e vendas"
      />
      <StatCard
        label="Valor do elenco"
        icon={Coins}
        value={formatMoney(club.squad_value)}
        unit="moedas"
        help="Soma dos valores de mercado"
      />
      <StatCard
        label="Patrimônio"
        icon={Landmark}
        value={formatMoney(club.net_worth)}
        unit="moedas"
        help="Caixa + valor do elenco"
      />
      <StatCard
        label="Elenco"
        icon={Shirt}
        value={`${formatInteger(club.players.length)} de ${MAX_SQUAD}`}
        help={`Limite de ${MAX_SQUAD} jogadores`}
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  icon: LucideIcon;
  value: string;
  unit?: string;
  help: string;
}

function StatCard({ label, icon: Icon, value, unit, help }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon aria-hidden className="size-4" />
      </div>
      <p className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </p>
      <span className="text-xs text-muted-foreground">{help}</span>
    </div>
  );
}
