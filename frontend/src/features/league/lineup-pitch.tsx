import { HeartPulse, Plus } from 'lucide-react';
import type { Player } from '@/api/players';
import { initials } from '@/features/players/player-labels';
import { SECTORS, type Sector, type Slot } from './formations';

// De cima para baixo: o ataque no alto do campo e o goleiro embaixo.
const ROW_ORDER: Sector[] = ['ATA', 'MEI', 'DEF', 'GOL'];

interface LineupPitchProps {
  slots: Slot[];
  playerOf: (slot: Slot) => Player | undefined;
}

// Prévia da formação: cada vaga com o titular escolhido, ou tracejada enquanto estiver vazia.
export function LineupPitch({ slots, playerOf }: LineupPitchProps) {
  const rows = ROW_ORDER.map((sector) =>
    slots.filter((slot) => slot.sector === sector),
  ).filter((row) => row.length > 0);
  return (
    <div
      role="img"
      aria-label="Prévia da formação no campo"
      className="relative flex aspect-[4/5] flex-col justify-around overflow-hidden rounded-lg bg-pitch py-4"
      style={{
        backgroundImage:
          'repeating-linear-gradient(to bottom, transparent 0 12.5%, var(--pitch-stripe) 12.5% 25%)',
      }}
    >
      <PitchLines />
      {rows.map((row) => (
        <div key={row[0].sector} className="relative flex justify-around px-4">
          {row.map((slot) => (
            <PitchSpot key={slot.key} slot={slot} player={playerOf(slot)} />
          ))}
        </div>
      ))}
    </div>
  );
}

function PitchSpot({ slot, player }: { slot: Slot; player?: Player }) {
  if (!player) {
    return (
      <div className="flex w-24 flex-col items-center gap-1.5">
        <span className="flex size-9 items-center justify-center rounded-full border-2 border-dashed border-white/70 text-white/80">
          <Plus aria-hidden className="size-4" />
        </span>
        <PitchLabel>{SECTORS[slot.sector].label}</PitchLabel>
      </div>
    );
  }
  return (
    <div className="flex w-24 flex-col items-center gap-1.5">
      <span className="relative flex size-9 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-semibold text-primary-foreground">
        {initials(player.name)}
        {player.condition === 'MAL_CONDICIONADO' && (
          <span
            title="Mal condicionado"
            className="absolute -top-1.5 -left-1.5 flex size-4 items-center justify-center rounded-full border border-white bg-warning-soft text-warning-soft-foreground"
          >
            <HeartPulse aria-hidden className="size-2.5" />
          </span>
        )}
      </span>
      <PitchLabel>{surname(player.name)}</PitchLabel>
    </div>
  );
}

function PitchLabel({ children }: { children: string }) {
  return (
    <span className="max-w-full truncate rounded-md bg-black/45 px-1.5 py-0.5 text-xs font-medium text-white">
      {children}
    </span>
  );
}

// Linhas do campo: meio-campo, círculo central e as duas grandes áreas.
function PitchLines() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-2">
      <div className="absolute inset-0 border border-pitch-line" />
      <div className="absolute inset-x-0 top-1/2 border-t border-pitch-line" />
      <div className="absolute top-1/2 left-1/2 size-16 -translate-1/2 rounded-full border border-pitch-line" />
      <div className="absolute top-0 left-1/2 h-[14%] w-1/2 -translate-x-1/2 border border-t-0 border-pitch-line" />
      <div className="absolute bottom-0 left-1/2 h-[14%] w-1/2 -translate-x-1/2 border border-b-0 border-pitch-line" />
    </div>
  );
}

function surname(name: string): string {
  return name.trim().split(/\s+/).at(-1) ?? name;
}
