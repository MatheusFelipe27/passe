import { toast } from 'sonner';

// Avisos de resultado das ações: sucesso, ou a recusa com o message devolvido pela API.
export function notifySuccess(title: string, description?: string): void {
  toast.success(title, { description });
}

export function notifyError(title: string, error: unknown): void {
  toast.error(title, {
    description:
      error instanceof Error ? error.message : 'Tente de novo em instantes.',
  });
}
