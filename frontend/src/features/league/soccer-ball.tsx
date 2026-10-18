import { useId } from 'react';
import { cn } from 'cn';

// Bola de futebol do mockup (o lucide não tem uma): círculo branco, o pentágono do centro e os
// 5 gomos da borda na cor do texto, ligados por costuras.
const CENTER = 12;
const RADIUS = 10;

function pentagon(cx: number, cy: number, size: number, turn: number): string {
  return Array.from({ length: 5 }, (_, index) => {
    const angle = ((turn + index * 72) * Math.PI) / 180;
    return `${(cx + size * Math.cos(angle)).toFixed(2)},${(cy + size * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}

// As pontas do pentágono central apontam para os gomos da borda.
const DIRECTIONS = Array.from({ length: 5 }, (_, index) => -90 + index * 72);

const point = (angle: number, distance: number) => {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER + distance * Math.cos(radians),
    y: CENTER + distance * Math.sin(radians),
  };
};

export function SoccerBall({ className }: { className?: string }) {
  const clipId = useId();
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn('size-4 shrink-0', className)}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={CENTER} cy={CENTER} r={RADIUS} />
        </clipPath>
      </defs>
      <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="white" />
      <g clipPath={`url(#${clipId})`} fill="currentColor">
        <polygon points={pentagon(CENTER, CENTER, 4, -90)} />
        {DIRECTIONS.map((angle) => {
          const patch = point(angle, 10.6);
          const seamStart = point(angle, 4);
          const seamEnd = point(angle, 8);
          return (
            <g key={angle}>
              <line
                x1={seamStart.x}
                y1={seamStart.y}
                x2={seamEnd.x}
                y2={seamEnd.y}
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <polygon points={pentagon(patch.x, patch.y, 3.6, angle + 180)} />
            </g>
          );
        })}
      </g>
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
