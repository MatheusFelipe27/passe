import type { ReactNode } from 'react';
import { cn } from 'cn';

// Lista de valores devolvidos pela API nas janelas de resultado (cadastro, compra e venda).
export function ResultList({ children }: { children: ReactNode }) {
  return <dl className="divide-y rounded-xl border">{children}</dl>;
}

interface ResultRowProps {
  label: string;
  help?: string;
  value: ReactNode;
  highlight?: boolean;
  valueClassName?: string;
}

export function ResultRow({
  label,
  help,
  value,
  highlight = false,
  valueClassName,
}: ResultRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3',
        highlight && 'bg-muted-subtle',
      )}
    >
      <dt className="flex flex-col">
        <span className={highlight ? 'font-medium' : 'text-muted-foreground'}>
          {label}
        </span>
        {help && <span className="text-xs text-muted-foreground">{help}</span>}
      </dt>
      <dd
        className={cn(
          'text-right tabular-nums',
          highlight ? 'text-lg font-semibold' : 'font-medium',
          valueClassName,
        )}
      >
        {value}
      </dd>
    </div>
  );
}
