import { z } from 'zod';

const REQUIRED = 'é obrigatório';
const INVALID_VALUE = 'valor inválido';
const BODY_MUST_BE_OBJECT = 'O corpo da requisição deve ser um objeto JSON.';

const TYPE_MESSAGES: Record<string, string> = {
  string: 'deve ser um texto',
  number: 'deve ser um número inteiro',
  int: 'deve ser um número inteiro',
  boolean: 'deve ser verdadeiro ou falso',
  array: 'deve ser uma lista',
  object: 'deve ser um objeto',
};

export const validationErrorMap: z.core.$ZodErrorMap = (issue) => {
  if (issue.code === 'invalid_type' && isRootObject(issue)) {
    return BODY_MUST_BE_OBJECT;
  }
  if (issue.input === undefined || issue.input === null) {
    return REQUIRED;
  }
  switch (issue.code) {
    case 'invalid_type':
      return TYPE_MESSAGES[issue.expected] ?? INVALID_VALUE;
    case 'too_small':
      return `deve ser no mínimo ${issue.minimum}`;
    case 'too_big':
      return `deve ser no máximo ${issue.maximum}`;
    case 'invalid_value':
      return `deve ser um de: ${issue.values.join(', ')}`;
    default:
      return INVALID_VALUE;
  }
};

function isRootObject(issue: { expected: string; path?: PropertyKey[] }) {
  return issue.expected === 'object' && (issue.path ?? []).length === 0;
}
