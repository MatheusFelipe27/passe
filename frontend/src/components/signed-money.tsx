import { cn } from 'cn';
import { formatSignedMoney } from '@/lib/format';

// Valor com sinal: entrada em verde com "+", saída em vermelho com "−" e zero sem cor.
export function SignedMoney({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'tabular-nums',
        value > 0 && 'text-success',
        value < 0 && 'text-destructive',
        className,
      )}
    >
      {formatSignedMoney(value)}
    </span>
  );
}
