import type { ReactNode } from 'react';
import { ArrowLeft, Goal, HeartPulse, SearchX } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { ApiError } from '@/api/http-client';
import type { Duel, DuelPlayer, MatchDetail, MatchSide } from '@/api/league';
import { ErrorState, EmptyState, LoadingState } from '@/components/list-states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useClubs } from '@/hooks/use-clubs';
import { useMatch } from '@/hooks/use-league';
import { PlayerAvatar } from '@/features/players/player-cells';
import { ATTRIBUTE_NAMES } from '@/features/players/player-labels';
import { Scoreboard } from './match-cells';
import { attackerSlot, defenderSlot, slotLabel } from './match-lineup';
import { MatchPitch } from './match-pitch';
import { SoccerBall } from './soccer-ball';

// RN21: a partida com os 6 duelos, como foram gravados; a tela não recalcula nada.
export function MatchPage() {
  const { id = '' } = useParams();
  const match = useMatch(id);
  const clubs = useClubs();
  const acronymOf = (clubId: number) =>
    clubs.data?.find((club) => club.id === clubId)?.acronym;

  if (match.error instanceof ApiError && match.error.status === 404) {
    return (
      <section className="rounded-xl border bg-card shadow-xs">
        <EmptyState
          icon={SearchX}
          title="Partida não encontrada"
          description={`${match.error.message} O endereço pode estar errado ou a partida não existe.`}
          action={<BackToMatches variant="outline" />}
        />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackToMatches variant="ghost" />
      </div>
      {match.isPending ? (
        <Panel>
          <LoadingState />
        </Panel>
      ) : match.error ? (
        <Panel>
          <ErrorState
            title="Não foi possível carregar a partida"
            error={match.error}
            onRetry={() => void match.refetch()}
          />
        </Panel>
      ) : (
        <>
          <section
            aria-label="Placar"
            className="rounded-xl border bg-card px-6 py-5 shadow-xs"
          >
            <Scoreboard
              match={match.data}
              acronymOf={acronymOf}
              showFormation
            />
          </section>
          <Panel>
            <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
              <div className="flex flex-col gap-0.5">
                <h2 className="font-semibold">Em campo</h2>
                <p className="text-xs text-muted-foreground">
                  Titulares de cada clube na formação da partida e os valores
                  usados nos duelos, já com o efeito da condição.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <HeartPulse
                    aria-hidden
                    className="size-3.5 text-warning-soft-foreground"
                  />
                  Mal condicionado
                </span>
                <span className="flex items-center gap-1.5">
                  <SoccerBall className="size-3.5 text-foreground" />
                  Gol no duelo
                </span>
              </div>
            </header>
            <div className="p-4">
              <MatchPitch match={match.data} />
            </div>
          </Panel>
          <Duels match={match.data} acronymOf={acronymOf} />
        </>
      )}
    </div>
  );
}

function BackToMatches({ variant }: { variant: 'ghost' | 'outline' }) {
  return (
    <Button asChild variant={variant}>
      <Link to="/partidas">
        <ArrowLeft aria-hidden />
        Voltar para partidas
      </Link>
    </Button>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
      {children}
    </section>
  );
}

function Duels({
  match,
  acronymOf,
}: {
  match: MatchDetail;
  acronymOf: (clubId: number) => string | undefined;
}) {
  const sides = [
    { side: match.home, role: 'mandante', opponent: match.away },
    { side: match.away, role: 'visitante', opponent: match.home },
  ];
  return (
    <section
      aria-label="Duelos"
      className="overflow-hidden rounded-xl border bg-card shadow-xs"
    >
      <header className="flex flex-col gap-0.5 border-b px-5 py-4">
        <h2 className="font-semibold">Duelos</h2>
        <p className="text-xs text-muted-foreground">
          Os 3 ataques do mandante e depois os 3 do visitante. Os jogadores de
          linha vão do 1º (o mais recuado) ao 4º (o mais avançado), pela ordem
          do elenco: o 4º ataca o goleiro, o 3º ataca o 1º e o 2º ataca o 2º.
        </p>
      </header>
      <Table>
        <TableHeader className="bg-muted-subtle">
          <TableRow>
            <TableHead className="pl-5">Duelo</TableHead>
            <TableHead>Atacante</TableHead>
            <TableHead>Ataque</TableHead>
            <TableHead>Defensor</TableHead>
            <TableHead>Defesa</TableHead>
            <TableHead className="pr-5">Resultado</TableHead>
          </TableRow>
        </TableHeader>
        {sides.map(({ side, role, opponent }) => (
          <TableBody
            key={side.club_id}
            aria-label={`Ataques do ${side.club_name}`}
          >
            <TableRow className="bg-muted-subtle hover:bg-muted-subtle">
              <TableCell colSpan={5} className="pl-5 font-medium">
                <span className="mr-2 rounded-md bg-muted px-1.5 py-0.5 text-xs">
                  {acronymOf(side.club_id)}
                </span>
                Ataques do {side.club_name} ({role})
              </TableCell>
              <TableCell className="pr-5 text-right text-xs text-muted-foreground">
                {goalsText(side)}
              </TableCell>
            </TableRow>
            {match.duels
              .filter((duel) => duel.attacking_club_id === side.club_id)
              .map((duel) => (
                <DuelRow
                  key={duel.order}
                  duel={duel}
                  attacking={side}
                  defending={opponent}
                />
              ))}
          </TableBody>
        ))}
      </Table>
    </section>
  );
}

// O total de gols de cada lado é o placar devolvido pela API.
function goalsText(side: MatchSide): string {
  if (side.goals === 0) {
    return 'nenhum gol';
  }
  return side.goals === 1 ? '1 gol' : `${side.goals} gols`;
}

function DuelRow({
  duel,
  attacking,
  defending,
}: {
  duel: Duel;
  attacking: MatchSide;
  defending: MatchSide;
}) {
  return (
    <TableRow>
      <TableCell className="pl-5">
        <span className="inline-flex size-7 items-center justify-center rounded-md border text-xs font-medium">
          {duel.order}
        </span>
      </TableCell>
      <TableCell>
        <DuelPerson
          player={duel.attacker}
          detail={`${duel.attacker.position}, ${slotLabel(attackerSlot(duel))} · ${attacking.club_name}`}
        />
      </TableCell>
      <TableCell>
        <DuelValue player={duel.attacker} />
      </TableCell>
      <TableCell>
        <DuelPerson
          player={duel.defender}
          detail={
            defenderSlot(duel) === 0
              ? `Goleiro · ${defending.club_name}`
              : `${duel.defender.position}, ${slotLabel(defenderSlot(duel))} · ${defending.club_name}`
          }
        />
      </TableCell>
      <TableCell>
        <DuelValue player={duel.defender} />
      </TableCell>
      <TableCell className="pr-5">
        {duel.goal ? (
          <Badge
            variant="outline"
            className="border-success-soft-border bg-success-soft text-success-soft-foreground"
          >
            <Goal aria-hidden />
            Gol
          </Badge>
        ) : (
          <Badge variant="outline">Sem gol</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

function DuelPerson({
  player,
  detail,
}: {
  player: DuelPlayer;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <PlayerAvatar
        player={{ id: player.player_id, name: player.player_name }}
      />
      <span className="flex flex-col">
        <span className="flex items-center gap-1.5 font-medium">
          {player.player_name}
          {player.condition === 'MAL_CONDICIONADO' && (
            <HeartPulse
              aria-label="Mal condicionado"
              className="size-3.5 text-warning-soft-foreground"
            />
          )}
        </span>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </span>
    </div>
  );
}

// O valor já vem com o efeito da condição (RN20): a tela só mostra.
function DuelValue({ player }: { player: DuelPlayer }) {
  return (
    <span className="text-muted-foreground">
      {ATTRIBUTE_NAMES[player.attribute]}{' '}
      <span className="font-semibold text-foreground tabular-nums">
        {player.value}
      </span>
    </span>
  );
}
