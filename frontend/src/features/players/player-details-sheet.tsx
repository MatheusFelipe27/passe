import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Coins,
  HeartPulse,
  Pencil,
  Tag,
  TrendingUp,
} from 'lucide-react';
import type { Club } from '@/api/league';
import type { Player } from '@/api/players';
import { ErrorState, LoadingState } from '@/components/list-states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { usePlayer } from '@/hooks/use-players';
import { formatMoney } from '@/lib/format';
import { AttributeBars } from './attribute-bars';
import { ConditionBadge, PlayerAvatar } from './player-cells';
import { POSITION_NAMES } from './player-labels';

interface PlayerDetailsSheetProps {
  playerId: number | undefined;
  clubs: Club[] | undefined;
  onClose: () => void;
  onEdit: (player: Player) => void;
  onChangeCondition: (player: Player) => void;
}

// Painel lateral com o jogador como a API devolve agora (GET /players/{id}).
export function PlayerDetailsSheet({
  playerId,
  clubs,
  onClose,
  onEdit,
  onChangeCondition,
}: PlayerDetailsSheetProps) {
  return (
    <Sheet
      open={playerId !== undefined}
      onOpenChange={(open) => !open && onClose()}
    >
      <SheetContent className="w-[460px] gap-0 sm:max-w-[460px]">
        {playerId !== undefined && (
          <PlayerDetails
            playerId={playerId}
            clubs={clubs}
            onEdit={onEdit}
            onChangeCondition={onChangeCondition}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function PlayerDetails({
  playerId,
  clubs,
  onEdit,
  onChangeCondition,
}: Omit<PlayerDetailsSheetProps, 'playerId' | 'onClose'> & {
  playerId: number;
}) {
  const query = usePlayer(playerId);
  const player = query.data;

  if (query.isPending) {
    return (
      <>
        <SheetTitle className="sr-only">Detalhes do jogador</SheetTitle>
        <LoadingState />
      </>
    );
  }
  if (query.error || !player) {
    return (
      <>
        <SheetTitle className="sr-only">Detalhes do jogador</SheetTitle>
        <ErrorState
          title="Não foi possível carregar o jogador"
          error={query.error ?? new Error('Jogador não encontrado.')}
          onRetry={() => void query.refetch()}
        />
      </>
    );
  }

  const club = clubs?.find((item) => item.id === player.club_id);

  return (
    <>
      <SheetHeader className="flex-row items-center gap-3 p-6 pb-4">
        <PlayerAvatar player={player} />
        <div className="flex flex-col gap-1.5">
          <SheetTitle>{player.name}</SheetTitle>
          <SheetDescription className="sr-only">
            {POSITION_NAMES[player.position]}
          </SheetDescription>
          <div className="flex gap-1.5">
            <Badge variant="outline">{player.position}</Badge>
            <ConditionBadge condition={player.condition} />
            <Badge variant="secondary">
              {player.club_id === null
                ? 'Livre'
                : (club?.acronym ?? 'Com clube')}
            </Badge>
          </div>
        </div>
      </SheetHeader>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Coins}
            label="Valor de mercado"
            value={formatMoney(player.market_value)}
            help="Calculado automaticamente"
          />
          <StatCard
            icon={Tag}
            label="Valor base"
            value={formatMoney(player.base_value)}
            help="Calculado no cadastro"
          />
          <StatCard
            icon={BarChart3}
            label="Overall"
            value={String(player.overall)}
            help="Calculado pela posição"
          />
          <StatCard
            icon={TrendingUp}
            label="Potencial"
            value={String(player.potential)}
            help="Informado no cadastro"
          />
        </div>
        <section
          aria-label="Indicadores técnicos"
          className="flex flex-col gap-3"
        >
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold">Indicadores técnicos</h3>
            <span className="text-xs text-muted-foreground">
              Escala de 1 a 99
            </span>
          </div>
          <AttributeBars attributes={player} potential={player.potential} />
          <p className="text-xs text-muted-foreground">
            Faixa clara: até o potencial ({player.potential}), que nenhum
            atributo passa.
          </p>
        </section>
        <dl className="divide-y rounded-xl border">
          <InfoRow label="Idade">{player.age} anos</InfoRow>
          <InfoRow label="Agilidade">{player.agility}</InfoRow>
          <InfoRow label="Clube">
            {player.club_id === null
              ? 'Livre'
              : (club?.name ?? `Clube ${player.club_id}`)}
          </InfoRow>
        </dl>
      </div>
      <SheetFooter className="flex-row border-t p-6">
        <Button variant="outline" onClick={() => onEdit(player)}>
          <Pencil aria-hidden />
          Editar
        </Button>
        <Button variant="outline" onClick={() => onChangeCondition(player)}>
          <HeartPulse aria-hidden />
          Alterar condição
        </Button>
      </SheetFooter>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  help,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  help: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border p-3">
      <span className="flex items-center justify-between text-xs text-muted-foreground">
        {label}
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{help}</span>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
