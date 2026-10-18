import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CircleAlert, Info, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Faixa de recusa nas janelas de ação, com o message devolvido pela API.
export function RefusalAlert({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Alert
      variant="destructive"
      className="border-destructive-soft-border bg-destructive-soft px-4 py-3"
    >
      <CircleAlert aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

// Faixa de atenção: a ação é aceita, mas tem um efeito que vale avisar antes (ex.: titular que sai da escalação).
export function WarningAlert({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Alert className="border-warning-soft-border bg-warning-soft px-4 py-3 text-warning-soft-foreground">
      <TriangleAlert aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="text-warning-soft-foreground">
        {children}
      </AlertDescription>
    </Alert>
  );
}

// Caixa informativa discreta das janelas: explica uma regra sem pedir ação.
export function InfoNote({
  icon: Icon = Info,
  children,
}: {
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <p className="flex items-start gap-2.5 rounded-lg border bg-muted-subtle px-3 py-2.5 text-sm text-muted-foreground">
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
