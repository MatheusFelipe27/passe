import { Check } from 'lucide-react';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';

const SIZES = {
  sm: 'size-8 rounded-lg text-xs',
  lg: 'size-12 rounded-xl text-base',
};

// Quadrado com a sigla, que identifica o clube nas listas e no cabeçalho da página.
export function ClubAvatar({
  acronym,
  size = 'sm',
}: {
  acronym: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center border bg-muted font-semibold',
        SIZES[size],
      )}
    >
      {acronym}
    </span>
  );
}

const PENALTY_STYLES = {
  none: 'border-success-soft-border bg-success-soft text-success-soft-foreground',
  medium:
    'border-warning-soft-border bg-warning-soft text-warning-soft-foreground',
  high: 'border-destructive-soft-border bg-destructive-soft text-destructive-soft-foreground',
};

// Percentual de multa devolvido pela API (RN15): sem multa em verde, a maior faixa em vermelho.
export function PenaltyBadge({ rate }: { rate: number }) {
  const style =
    rate === 0
      ? PENALTY_STYLES.none
      : rate >= 20
        ? PENALTY_STYLES.high
        : PENALTY_STYLES.medium;
  return (
    <Badge variant="outline" className={cn('rounded-md', style)}>
      {rate === 0 && <Check aria-hidden />}
      {rate}%
    </Badge>
  );
}
