import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingState() {
  return (
    <div role="status" className="flex flex-col gap-3 p-4">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <span className="text-xs text-muted-foreground">Carregando…</span>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
}

// Sem ícone, a versão compacta das tabelas; com ícone, a versão centralizada que ocupa o quadro.
export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: EmptyStateProps) {
  if (Icon) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
        <span className="mb-2 flex size-12 items-center justify-center rounded-xl bg-muted">
          <Icon aria-hidden className="size-6 text-muted-foreground" />
        </span>
        <span className="text-base font-semibold">{title}</span>
        <span className="max-w-[420px] text-sm text-muted-foreground">
          {description}
        </span>
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1 p-4">
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  error: Error;
  onRetry: () => void;
}

// Erro de carregamento: mostra o message devolvido pela API e permite tentar de novo.
export function ErrorState({ title, error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 p-4">
      <Alert variant="destructive">
        <CircleAlert aria-hidden />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  );
}
