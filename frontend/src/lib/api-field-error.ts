import { ApiError } from '@/api/http-client';

const FIELD_MESSAGE = /^([a-z_]+): (.+)$/;

export interface ApiFieldError {
  field: string;
  message: string;
}

const FIELD_STATUSES = [400, 409];

// Quando a recusa é de um campo só, a API responde "campo: mensagem": dados inválidos (400) ou
// valor repetido (409). Assim a tela põe o erro junto ao campo.
export function readApiFieldError(error: unknown): ApiFieldError | undefined {
  if (!(error instanceof ApiError) || !FIELD_STATUSES.includes(error.status)) {
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
