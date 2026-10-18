import { ArrowLeft, ArrowRight, HeartPulse } from 'lucide-react';
import type { CSSProperties } from 'react';
import { cn } from 'cn';
import type { DuelAttribute, MatchDetail, MatchSide } from '@/api/league';
import { initials } from '@/features/players/player-labels';
import { sectorOf, type Sector } from './formations';
import { startersOf, type MatchStarter } from './match-lineup';
import { SoccerBall } from './soccer-ball';

const ATTRIBUTE_SHORT: Record<DuelAttribute, string> = {
  shooting: 'Fin',
  passing: 'Pas',
  dribbling: 'Dri',
  defending: 'Def',
};

// Distância de cada setor até a linha de fundo do próprio time, em % da largura do campo.
const SECTOR_X: Record<Sector, number> = { GOL: 7, DEF: 19, MEI: 30, ATA: 41 };

// RN20: os titulares dos dois clubes, cada um no setor da posição, com os valores usados nos
// duelos (já com o efeito da condição), como a API devolveu.
export function MatchPitch({ match }: { match: MatchDetail }) {
  return (
    <div
      role="img"
      aria-label="Titulares dos dois clubes no campo"
      className="relative aspect-[2.4/1] overflow-hidden rounded-lg bg-pitch"
      style={{
        backgroundImage:
          'repeating-linear-gradient(to right, transparent 0 6.25%, var(--pitch-stripe) 6.25% 12.5%)',
      }}
    >
      <FieldLines />
      <TeamTag side={match.home} position="left" />
      <TeamTag side={match.away} position="right" />
      <Team match={match} side={match.home} mirrored={false} />
      <Team match={match} side={match.away} mirrored />
    </div>
  );
}

function Team({
  match,
  side,
  mirrored,
}: {
  match: MatchDetail;
  side: MatchSide;
  mirrored: boolean;
}) {
  const starters = startersOf(match, side.club_id);
  return starters.map((starter) => {
    const sector = sectorOf(starter.player.position);
    const column = starters.filter(
      (other) => sectorOf(other.player.position) === sector,
    );
    const row = column.indexOf(starter);
    const x = mirrored ? 100 - SECTOR_X[sector] : SECTOR_X[sector];
    const y = ((row + 1) / (column.length + 1)) * 100;
    return (
      <Spot
        key={starter.player.player_id}
        starter={starter}
        home={!mirrored}
        style={{ left: `${x}%`, top: `${y}%` }}
      />
    );
  });
}

function Spot({
  starter,
  home,
  style,
}: {
  starter: MatchStarter;
  home: boolean;
  style: CSSProperties;
}) {
  const { player, attack, defense } = starter;
  const values = [attack, defense]
    .filter((value) => value !== undefined)
    .map((value) => `${ATTRIBUTE_SHORT[value.attribute]} ${value.value}`);
  return (
    <div
      className="absolute flex w-32 -translate-x-1/2 -translate-y-1/3 flex-col items-center gap-1"
      style={style}
    >
      <span
        className={cn(
          'relative flex size-9 items-center justify-center rounded-full border-2 text-xs font-semibold',
          home
            ? 'border-white bg-primary text-primary-foreground'
            : 'border-white bg-white text-foreground',
        )}
      >
        {initials(player.player_name)}
        {player.condition === 'MAL_CONDICIONADO' && (
          <span
            title="Mal condicionado"
            className="absolute -top-1.5 -left-1.5 flex size-4 items-center justify-center rounded-full border border-white bg-warning-soft text-warning-soft-foreground"
          >
            <HeartPulse aria-hidden className="size-2.5" />
          </span>
        )}
        {starter.scored && (
          <span
            title="Gol no duelo"
            className="absolute -top-1.5 -right-1.5 flex text-foreground"
          >
            <SoccerBall className="size-4" />
          </span>
        )}
      </span>
      <span className="max-w-full truncate rounded-md bg-black/45 px-1.5 py-0.5 text-xs font-medium text-white">
        {player.player_name}
      </span>
      <span className="rounded-md bg-black/30 px-1.5 py-0.5 text-[11px] text-white/90 tabular-nums">
        {[player.position, ...values].join(' · ')}
      </span>
    </div>
  );
}

function TeamTag({
  side,
  position,
}: {
  side: MatchSide;
  position: 'left' | 'right';
}) {
  const Arrow = position === 'left' ? ArrowRight : ArrowLeft;
  return (
    <span
      className={cn(
        'absolute top-4 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-xs text-white',
        position === 'left' ? 'left-4' : 'right-4',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-2 rounded-full',
          position === 'left' ? 'bg-primary' : 'bg-white',
        )}
      />
      <span className="font-medium">{side.club_name}</span>
      {side.formation}
      <span aria-hidden className="h-3 w-px bg-white/40" />
      ataca
      <Arrow aria-hidden className="size-3" />
    </span>
  );
}

// Linhas do campo na horizontal: meio-campo, círculo central e as duas grandes áreas.
function FieldLines() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-3">
      <div className="absolute inset-0 border border-pitch-line" />
      <div className="absolute inset-y-0 left-1/2 border-l border-pitch-line" />
      <div className="absolute top-1/2 left-1/2 size-24 -translate-1/2 rounded-full border border-pitch-line" />
      <div className="absolute top-1/2 left-0 h-3/5 w-[9%] -translate-y-1/2 border border-l-0 border-pitch-line" />
      <div className="absolute top-1/2 right-0 h-3/5 w-[9%] -translate-y-1/2 border border-r-0 border-pitch-line" />
    </div>
  );
}
