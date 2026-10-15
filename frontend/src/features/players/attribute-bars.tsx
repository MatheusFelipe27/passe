import { BarChart3 } from 'lucide-react';
import type { PlayerAttributes } from '@/api/players';
import { ATTRIBUTE_NAMES } from './player-labels';

const ATTRIBUTE_MAX = 99;

interface AttributeBarsProps {
  attributes: PlayerAttributes;
  potential: number;
}

// Barras dos seis atributos, com a faixa clara até o potencial. Só desenha os valores: não calcula nada.
export function AttributeBars({ attributes, potential }: AttributeBarsProps) {
  return (
    <ul className="flex flex-col gap-2">
      {(Object.keys(ATTRIBUTE_NAMES) as (keyof PlayerAttributes)[]).map(
        (attribute) => (
          <li
            key={attribute}
            className="grid grid-cols-[88px_1fr_28px] items-center gap-3 text-sm"
          >
            <span className="text-muted-foreground">
              {ATTRIBUTE_NAMES[attribute]}
            </span>
            <span aria-hidden className="relative h-1.5 rounded-full bg-muted">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-primary/25"
                style={{ width: `${(potential / ATTRIBUTE_MAX) * 100}%` }}
              />
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                style={{
                  width: `${(attributes[attribute] / ATTRIBUTE_MAX) * 100}%`,
                }}
              />
            </span>
            <span className="text-right font-medium tabular-nums">
              {attributes[attribute]}
            </span>
          </li>
        ),
      )}
    </ul>
  );
}

export function AttributePreviewCard({
  attributes,
  potential,
  hasErrors,
}: {
  attributes: PlayerAttributes | undefined;
  potential: number | undefined;
  hasErrors: boolean;
}) {
  return (
    <section
      aria-label="Prévia dos atributos"
      className="flex flex-col gap-3 rounded-xl border bg-muted-subtle p-4"
    >
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <BarChart3 aria-hidden className="size-4" />
        Prévia dos atributos
      </span>
      {attributes && potential !== undefined && !hasErrors ? (
        <>
          <AttributeBars attributes={attributes} potential={potential} />
          <p className="text-xs text-muted-foreground">
            Faixa clara: até o potencial ({potential}). A prévia só desenha os
            valores digitados; não calcula overall nem valor base.
          </p>
        </>
      ) : (
        <p className="py-6 text-center text-xs text-muted-foreground">
          {hasErrors
            ? 'Corrija os valores destacados para ver a prévia.'
            : 'Preencha os atributos e o potencial para ver a prévia.'}
        </p>
      )}
    </section>
  );
}
