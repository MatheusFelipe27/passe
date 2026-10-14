import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary bg-primary-soft">
        <Icon aria-hidden className="size-[22px] text-primary" />
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <h1 className="text-2xl leading-8 font-semibold tracking-[-0.025em]">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actions}
    </div>
  );
}
