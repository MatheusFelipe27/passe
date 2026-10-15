import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from 'cn';
import { Label } from '@/components/ui/label';

export interface FieldControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
}

interface FormFieldProps {
  id: string;
  label: string;
  help?: string;
  error?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

// Campo de formulário: rótulo visível, o controle, e a ajuda ou a mensagem de erro logo abaixo.
export function FormField({
  id,
  label,
  help,
  error,
  className,
  children,
}: FormFieldProps) {
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error || help);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': hasMessage ? messageId : undefined,
      })}
      {error ? (
        <p
          id={messageId}
          role="alert"
          className="flex items-start gap-1.5 text-xs text-destructive"
        >
          <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        help && (
          <p id={messageId} className="text-xs text-muted-foreground">
            {help}
          </p>
        )
      )}
    </div>
  );
}
