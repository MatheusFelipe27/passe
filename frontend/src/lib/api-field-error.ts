import { ApiError } from '@/api/http-client';

const FIELD_MESSAGE = /^([a-z_]+): (.+)$/;

export interface ApiFieldError {
  field: string;
  message: string;
}

// A API recusa dados inválidos com "campo: mensagem" (400): assim a tela põe o erro junto ao campo.
export function readApiFieldError(error: unknown): ApiFieldError | undefined {
  if (!(error instanceof ApiError) || error.status !== 400) {
    return undefined;
  }
  const match = FIELD_MESSAGE.exec(error.message);
  if (!match) {
    return undefined;
  }
  const [, field, message] = match;
  return {
    field,
    message: `${message.charAt(0).toUpperCase()}${message.slice(1)}.`,
  };
}
