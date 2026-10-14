import { z } from 'zod';
import { money } from '../money/money';
import { MAX_ID } from '../pipes/parse-resource-id.pipe';

const POSITIVE_INTEGER = /^[1-9]\d*$/;
const DECIMAL = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

// Filtros: inteiro positivo só com dígitos, sem sinal, zeros à esquerda, ponto ou expoente.
export function integerParam(min: number, max = Number.MAX_SAFE_INTEGER) {
  return z
    .string()
    .regex(POSITIVE_INTEGER, { message: 'deve ser um número inteiro positivo' })
    .transform(Number)
    .pipe(z.number().min(min).max(max));
}

export function idParam() {
  return integerParam(1, MAX_ID);
}

// Filtros: decimal sem sinal, sem expoente e sem vírgula, com até 2 casas (10, 10.5 ou 10.55).
export function decimalParam(max: number) {
  return z
    .string()
    .regex(DECIMAL, {
      message: 'deve ser um decimal com até 2 casas, como 10.55',
    })
    .refine((value) => Number(value) <= max, {
      message: `deve ser no máximo ${max}`,
    })
    .transform((value) => money(value));
}

export function booleanParam() {
  return z.enum(['true', 'false']).transform((value) => value === 'true');
}
