import { ApiError } from '@/api/http-client';

export type ActionFailure =
  { kind: 'network' } | { kind: 'refused'; message: string };

const UNKNOWN_ERROR = 'Tente de novo em instantes.';

// Sem resposta da API, a operação não foi confirmada e pode ser tentada de novo; com resposta,
// é uma recusa, e a tela mostra o message.
export function toActionFailure(error: unknown): ActionFailure {
  if (error instanceof ApiError && error.status === 0) {
    return { kind: 'network' };
  }
  return {
    kind: 'refused',
    message: error instanceof Error ? error.message : UNKNOWN_ERROR,
  };
}
