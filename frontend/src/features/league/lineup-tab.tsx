import { useState, type ReactNode } from 'react';
import {
  Check,
  ChevronDown,
  CircleCheck,
  Lock,
  RefreshCw,
  Swords,
  TriangleAlert,
} from 'lucide-react';
import type { ClubDetail } from '@/api/clubs';
import type { Formation, Lineup } from '@/api/league';
import type { Player } from '@/api/players';
import { RefusalAlert, WarningAlert } from '@/components/dialog-notes';
import { ErrorState, LoadingState } from '@/components/list-states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLineup, useSaveLineup } from '@/hooks/use-league';
import { useSubmitOnce } from '@/hooks/use-submit-once';
import { notifySuccess } from '@/lib/notify';
import {
  toActionFailure,
  type ActionFailure,
} from '@/features/market/action-failure';
import { ConditionBadge, PlayerAvatar } from '@/features/players/player-cells';
import {
  ATTRIBUTE_NAMES,
  POSITION_NAMES,
} from '@/features/players/player-labels';
import { FormationIcon } from './formation-icon';
import {
  assignPlayers,
  DEFAULT_FORMATION,
  fitsSomeFormation,
  FORMATION_DESCRIPTIONS,
  FORMATIONS,
  LINEUP_SIZE,
  SECTORS,
  slotsOf,
  usedAttributes,
  type Picks,
  type Slot,
} from './formations';
import { LineupPitch } from './lineup-pitch';

interface LineupTabProps {
  clubId: string;
  club: ClubDetail | undefined;
  clubError: Error | null;
  reloadClub: () => Promise<unknown>;
}

export function LineupTab({
  clubId,
  club,
  clubError,
  reloadClub,
}: LineupTabProps) {
  const lineup = useLineup(clubId);

  if (lineup.error || (clubError && !club)) {
    return (
      <Panel>
        <ErrorState
          title="Não foi possível carregar a escalação"
          error={lineup.error ?? clubError!}
          onRetry={() => void Promise.all([lineup.refetch(), reloadClub()])}
        />
      </Panel>
    );
  }
  if (!lineup.data || !club) {
    return (
      <Panel>
        <LoadingState />
      </Panel>
    );
  }
  return (
    <LineupEditor
      clubId={clubId}
      club={club}
      lineup={lineup.data}
      reload={async () => {
        const [fresh] = await Promise.all([lineup.refetch(), reloadClub()]);
        return fresh.data;
      }}
    />
  );
}

interface LineupEditorProps {
  clubId: string;
  club: ClubDetail;
  lineup: Lineup;
  reload: () => Promise<Lineup | undefined>;
}

// O clube que nunca escalou começa na 2-1-1, com as vagas vazias: a tela não escolhe titulares.
function initialFormation(lineup: Lineup): Formation {
  return lineup.formation ?? DEFAULT_FORMATION;
}

function LineupEditor({ clubId, club, lineup, reload }: LineupEditorProps) {
  const saveLineup = useSaveLineup(clubId);
  const submitOnce = useSubmitOnce();
  const [failure, setFailure] = useState<ActionFailure>();
  const [source, setSource] = useState(lineup);
  const [formation, setFormation] = useState(initialFormation(lineup));
  const [picks, setPicks] = useState<Picks>(() =>
    assignPlayers(initialFormation(lineup), lineup.players),
  );

  function reset(saved: Lineup) {
    setSource(saved);
    setFormation(initialFormation(saved));
    setPicks(assignPlayers(initialFormation(saved), saved.players));
  }

  // Escalação nova vinda da API (salva aqui ou rebuscada): a tela volta para ela.
  if (source !== lineup) {
    reset(lineup);
  }

  const roster = club.players;
  const byId = new Map(
    [...lineup.players, ...roster].map((player) => [player.id, player]),
  );
  const slots = slotsOf(formation);
  const playerOf = (slot: Slot) => {
    const id = picks[slot.key];
    return id === undefined ? undefined : byId.get(id);
  };
  const chosen = slots.flatMap((slot) => playerOf(slot) ?? []);
  const chosenIds = new Set(chosen.map((player) => player.id));
  const isFilled = chosen.length === LINEUP_SIZE;
  const isSending = saveLineup.isPending;

  function choose(slot: Slot, playerId: number | undefined) {
    setPicks({ ...picks, [slot.key]: playerId });
  }

  function changeFormation(next: Formation) {
    setFormation(next);
    setPicks(assignPlayers(next, chosen));
  }

  // RN19: o pedido leva a formação e os 5 ids, e a API confere tudo de novo.
  function save() {
    void submitOnce(async () => {
      setFailure(undefined);
      try {
        const saved = await saveLineup.mutateAsync({
          formation,
          player_ids: slots.map((slot) => picks[slot.key]!),
        });
        notifySuccess(
          'Escalação salva',
          `${club.name} na ${saved.formation}, com os ${saved.players.length} titulares devolvidos pela API.`,
        );
      } catch (error) {
        const next = toActionFailure(error);
        setFailure(next);
        if (next.kind === 'refused') {
          reset((await reload()) ?? lineup);
        }
      }
    });
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-6">
      <Panel>
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-semibold">Titulares</h2>
            <p className="text-xs text-muted-foreground">
              1 goleiro e 4 jogadores de linha, na formação escolhida. Salvar
              troca os 5 de uma vez.
            </p>
          </div>
          <CompletenessBadge complete={lineup.complete} />
        </header>
        <div className="flex flex-col gap-4 px-5 pt-4">
          {failure?.kind === 'network' && (
            <RefusalAlert
              title="Sem conexão"
              message="A escalação não foi confirmada. Verifique a conexão e tente de novo."
            />
          )}
          {failure?.kind === 'refused' && (
            <RefusalAlert
              title="A escalação foi recusada"
              message={failure.message}
            />
          )}
          {!lineup.complete && (
            <WarningAlert
              title={`Escalação incompleta: o ${club.name} não pode jogar partidas`}
            >
              {incompleteReason(lineup, roster)}
            </WarningAlert>
          )}
          <FormationPicker
            value={formation}
            disabled={isSending}
            onChange={changeFormation}
          />
        </div>
        <Table className="mt-4">
          <TableHeader>
            <TableRow className="bg-muted-subtle">
              <TableHead className="pl-5">Vaga</TableHead>
              <TableHead>Titular</TableHead>
              <TableHead>Condição</TableHead>
              <TableHead className="text-right">Overall</TableHead>
              <TableHead className="pr-5">Atributos usados</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.map((slot) => (
              <SlotRow
                key={slot.key}
                slot={slot}
                player={playerOf(slot)}
                options={roster.filter(
                  (player) =>
                    SECTORS[slot.sector].positions.includes(player.position) &&
                    player.condition !== 'DOENTE' &&
                    (player.id === picks[slot.key] ||
                      !chosenIds.has(player.id)),
                )}
                inRoster={roster.some(
                  (player) =>
                    SECTORS[slot.sector].positions.includes(player.position) &&
                    player.condition !== 'DOENTE',
                )}
                disabled={isSending}
                onChoose={(playerId) => choose(slot, playerId)}
              />
            ))}
          </TableBody>
        </Table>
        <UnfitWarning players={chosen} />
        <footer className="flex items-center gap-4 border-t px-5 py-4">
          <p className="text-xs text-muted-foreground">
            {isFilled
              ? 'A escalação vale até ser trocada. Titular vendido ou que fica doente sai dela, e o clube só volta a jogar depois de escalar de novo.'
              : 'Escolha a formação e um titular para cada vaga para salvar.'}
          </p>
          <div className="ml-auto flex shrink-0 gap-2">
            <Button
              variant="outline"
              disabled={isSending}
              onClick={() => {
                setFailure(undefined);
                reset(lineup);
              }}
            >
              Cancelar
            </Button>
            <Button disabled={!isFilled || isSending} onClick={save}>
              {failure?.kind === 'network' ? (
                <RefreshCw aria-hidden />
              ) : (
                <Check aria-hidden />
              )}
              {isSending ? 'Salvando…' : 'Salvar escalação'}
            </Button>
          </div>
        </footer>
      </Panel>
      <div className="flex flex-col gap-6">
        <Panel>
          <header className="flex flex-col gap-0.5 border-b px-5 py-4">
            <h2 className="font-semibold">Em campo</h2>
            <p className="text-xs text-muted-foreground">
              {isFilled
                ? `Prévia da formação ${formation}, do goleiro ao ataque.`
                : `Prévia da formação ${formation}; as vagas vazias ficam tracejadas.`}
            </p>
          </header>
          <div className="p-4">
            <LineupPitch slots={slots} playerOf={playerOf} />
          </div>
          <p className="flex items-start gap-2.5 border-t px-5 py-4 text-xs text-muted-foreground">
            <Swords aria-hidden className="mt-0.5 size-4 shrink-0" />
            Na partida, atacam os 3 jogadores de linha mais avançados e defendem
            o goleiro e os 2 mais recuados. É gol quando o ataque é maior que a
            defesa.
          </p>
        </Panel>
        <Bench
          players={roster.filter((player) => !chosenIds.has(player.id))}
          rosterSize={roster.length}
        />
      </div>
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
      {children}
    </section>
  );
}

function CompletenessBadge({ complete }: { complete: boolean }) {
  return complete ? (
    <Badge
      variant="outline"
      className="border-success-soft-border bg-success-soft text-success-soft-foreground"
    >
      <CircleCheck aria-hidden />
      Completa
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-warning-soft-border bg-warning-soft text-warning-soft-foreground"
    >
      <TriangleAlert aria-hidden />
      Incompleta
    </Badge>
  );
}

// RN19: o motivo de a escalação salva não deixar o clube jogar, e o que fazer.
function incompleteReason(lineup: Lineup, roster: Player[]): string {
  const available = roster.filter((player) => player.condition !== 'DOENTE');
  const noFormation = !fitsSomeFormation(available);
  if (lineup.formation === null) {
    if (roster.length < LINEUP_SIZE) {
      const squad =
        roster.length === 0
          ? 'O elenco ainda não tem jogadores'
          : `O elenco tem ${plural(roster.length, 'jogador', 'jogadores')}`;
      return `${squad}, e a escalação precisa de 5: 1 goleiro e 4 jogadores de linha. Compre jogadores e salve a escalação com os 5 titulares.`;
    }
    return noFormation
      ? 'Sem os jogadores DOENTE, o elenco não fecha nenhuma formação. Compre jogadores e salve a escalação com os 5 titulares.'
      : 'O clube ainda não escalou. Escolha a formação e os 5 titulares e salve a escalação.';
  }
  const kept = `A ${lineup.formation} continua salva, com ${plural(lineup.players.length, 'titular', 'titulares')}: titular vendido ou que fica DOENTE sai da escalação e não volta sozinho.`;
  return noFormation
    ? `${kept} Sem os jogadores DOENTE, o elenco não fecha nenhuma formação: o clube precisa comprar um jogador e escalar de novo.`
    : `${kept} Escolha quem entra na vaga e salve a escalação de novo.`;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

interface FormationPickerProps {
  value: Formation;
  disabled: boolean;
  onChange: (formation: Formation) => void;
}

function FormationPicker({ value, disabled, onChange }: FormationPickerProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">Formação</span>
        <span className="text-xs text-muted-foreground">
          Os números contam os jogadores de linha de trás para frente. O goleiro
          fica fora da conta.
        </span>
      </legend>
      <RadioGroup
        value={value}
        disabled={disabled}
        onValueChange={(next) => onChange(next as Formation)}
        className="mt-3 grid-cols-4 gap-3"
      >
        {FORMATIONS.map((formation) => (
          <label
            key={formation}
            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-data-checked:border-primary has-data-checked:bg-primary-soft has-data-checked:ring-1 has-data-checked:ring-primary"
          >
            <FormationIcon formation={formation} />
            <span className="flex flex-col gap-0.5">
              <span className="flex items-center gap-2 font-semibold">
                <RadioGroupItem
                  value={formation}
                  aria-label={`${formation}: ${FORMATION_DESCRIPTIONS[formation]}`}
                />
                {formation}
              </span>
              <span className="text-xs text-balance text-muted-foreground">
                {FORMATION_DESCRIPTIONS[formation]}
              </span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

interface SlotRowProps {
  slot: Slot;
  player: Player | undefined;
  options: Player[];
  inRoster: boolean;
  disabled: boolean;
  onChoose: (playerId: number | undefined) => void;
}

function SlotRow({
  slot,
  player,
  options,
  inRoster,
  disabled,
  onChoose,
}: SlotRowProps) {
  const sector = SECTORS[slot.sector];
  const name =
    slot.count > 1 ? `${sector.label} ${slot.index + 1}` : sector.label;
  const placeholder =
    options.length > 0
      ? 'Escolha o titular'
      : inRoster
        ? `Sem ${sector.hint} disponível`
        : `Sem ${sector.hint} no elenco`;
  return (
    <TableRow>
      <TableCell className="pl-5">
        <span className="flex flex-col">
          <span className="font-medium">{sector.label}</span>
          <span className="text-xs text-muted-foreground">{sector.hint}</span>
        </span>
      </TableCell>
      <TableCell className="w-60">
        <div className="relative">
          <select
            aria-label={name}
            value={player?.id ?? ''}
            disabled={disabled || options.length === 0}
            onChange={(event) =>
              onChoose(
                event.target.value === ''
                  ? undefined
                  : Number(event.target.value),
              )
            }
            className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-input bg-transparent pr-9 pl-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted-subtle disabled:text-muted-foreground"
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {`${option.name} (${option.position})`}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </TableCell>
      <TableCell>
        {player && <ConditionBadge condition={player.condition} />}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {player?.overall}
      </TableCell>
      <TableCell className="pr-5">
        {player && (
          <span className="flex gap-4 text-muted-foreground">
            {usedAttributes(player.position).map((attribute) => (
              <span key={attribute}>
                {ATTRIBUTE_NAMES[attribute]}{' '}
                <span className="font-semibold text-foreground tabular-nums">
                  {player[attribute]}
                </span>
              </span>
            ))}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

// RN20: mal condicionado pode jogar, com 15% a menos em cada atributo.
function UnfitWarning({ players }: { players: Player[] }) {
  const unfit = players.filter(
    (player) => player.condition === 'MAL_CONDICIONADO',
  );
  if (unfit.length === 0) {
    return null;
  }
  const names = new Intl.ListFormat('pt-BR').format(
    unfit.map((player) => player.name),
  );
  return (
    <div className="px-5 pt-4 pb-1">
      <WarningAlert
        title={
          unfit.length === 1
            ? `${names} está mal condicionado`
            : `${names} estão mal condicionados`
        }
      >
        {unfit.length === 1 ? 'Pode jogar' : 'Podem jogar'}, mas cada atributo
        vale 15% a menos durante a partida.
      </WarningAlert>
    </div>
  );
}

function Bench({
  players,
  rosterSize,
}: {
  players: Player[];
  rosterSize: number;
}) {
  const hasSick = players.some((player) => player.condition === 'DOENTE');
  return (
    <Panel>
      <header className="flex flex-col gap-0.5 border-b px-5 py-4">
        <h2 className="font-semibold">Reservas</h2>
        <p className="text-xs text-muted-foreground">
          Jogadores do elenco fora da escalação.
        </p>
      </header>
      {players.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          {rosterSize === 0
            ? 'O clube ainda não tem jogadores.'
            : `Nenhum reserva: ${rosterSize === 1 ? 'o jogador do elenco está escolhido' : `os ${rosterSize} jogadores do elenco estão escolhidos`}.`}
        </p>
      ) : (
        <ul aria-label="Reservas" className="flex flex-col gap-3 px-5 py-4">
          {players.map((player) => (
            <li key={player.id} className="flex items-center gap-3">
              <PlayerAvatar player={player} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{player.name}</span>
                <span className="text-xs text-muted-foreground">
                  {POSITION_NAMES[player.position]}
                </span>
              </span>
              {player.condition !== 'APTO' && (
                <span className="ml-auto">
                  <ConditionBadge condition={player.condition} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {hasSick && (
        <p className="mx-5 mb-4 flex items-center gap-2 rounded-lg bg-muted-subtle px-3 py-2 text-xs text-muted-foreground">
          <Lock aria-hidden className="size-3.5" />
          Doente não pode ser escalado.
        </p>
      )}
    </Panel>
  );
}
