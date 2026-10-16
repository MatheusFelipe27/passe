import type { ReactNode } from 'react';
import { CircleCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ResultDialogProps {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}

// Janela de resultado de uma ação concluída: mostra os valores que a API devolveu.
export function ResultDialog({
  open,
  title,
  description,
  onClose,
  footer,
  children,
}: ResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] flex-col sm:max-w-lg">
        <DialogHeader>
          <span className="flex size-10 items-center justify-center rounded-full bg-success-soft">
            <CircleCheck aria-hidden className="size-5 text-success" />
          </span>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="-mx-4 min-h-0 overflow-y-auto px-4">{children}</div>
        <DialogFooter className="border-t pt-4">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
