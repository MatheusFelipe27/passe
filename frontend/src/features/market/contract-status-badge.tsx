import { cn } from 'cn';
import type { ContractStatus } from '@/api/market';
import { Badge } from '@/components/ui/badge';

const STATUS_STYLES: Record<ContractStatus, string> = {
  ATIVO:
    'border-success-soft-border bg-success-soft text-success-soft-foreground',
  RESCINDIDO:
    'border-warning-soft-border bg-warning-soft text-warning-soft-foreground',
  ENCERRADO: 'border-border bg-muted text-foreground',
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn('rounded-md', STATUS_STYLES[status])}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}
