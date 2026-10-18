import type { Formation } from '@/api/league';
import { slotsOf, type Sector } from './formations';

// Linhas do desenho, de cima (ataque) para baixo (goleiro), e a altura de cada uma.
const ROWS: { sector: Sector; y: number }[] = [
  { sector: 'ATA', y: 7 },
  { sector: 'MEI', y: 13 },
  { sector: 'DEF', y: 19 },
  { sector: 'GOL', y: 25 },
];

const WIDTH = 20;

// Campinho decorativo dos cartões de formação: um ponto por jogador, setor por setor.
export function FormationIcon({ formation }: { formation: Formation }) {
  const slots = slotsOf(formation);
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 30"
      className="h-10 w-7 shrink-0 rounded-sm"
    >
      <rect width="20" height="30" rx="2" className="fill-pitch" />
      <rect
        x="1.5"
        y="1.5"
        width="17"
        height="27"
        fill="none"
        strokeWidth="0.6"
        className="stroke-pitch-line"
      />
      <circle
        cx="10"
        cy="4"
        r="1.6"
        fill="none"
        strokeWidth="0.6"
        className="stroke-pitch-line"
      />
      {ROWS.flatMap(({ sector, y }) => {
        const row = slots.filter((slot) => slot.sector === sector);
        return row.map((slot) => (
          <circle
            key={slot.key}
            cx={(WIDTH / (row.length + 1)) * (slot.index + 1)}
            cy={y}
            r="1.7"
            fill="white"
          />
        ));
      })}
    </svg>
  );
}
