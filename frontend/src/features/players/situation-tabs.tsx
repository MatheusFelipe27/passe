import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatInteger } from '@/lib/format';
import type { ClubSituation } from './use-player-list-state';

interface SituationTabsProps {
  value: ClubSituation;
  counts: Record<ClubSituation, number | undefined>;
  freeDisabled: boolean;
  onChange: (situation: ClubSituation) => void;
}

const SITUATIONS: { value: ClubSituation; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'free', label: 'Livres' },
  { value: 'club', label: 'Em clubes' },
];

// Abas do filtro free: Todos (sem free), Livres (free=true) e Em clubes (free=false).
export function SituationTabs({
  value,
  counts,
  freeDisabled,
  onChange,
}: SituationTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as ClubSituation)}
    >
      <TabsList aria-label="Situação dos jogadores">
        {SITUATIONS.map((situation) => (
          <TabsTrigger
            key={situation.value}
            value={situation.value}
            disabled={situation.value === 'free' && freeDisabled}
            title={
              situation.value === 'free' && freeDisabled
                ? '“Livres” não combina com o filtro por clube.'
                : undefined
            }
          >
            {situation.label}
            <span className="text-muted-foreground">
              {counts[situation.value] === undefined
                ? ''
                : formatInteger(counts[situation.value] ?? 0)}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
