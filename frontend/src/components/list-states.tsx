import type { ReactNode } from 'react';
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
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
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
