import { formatMoney } from '@/lib/format';

const MIN_AGE = 16;
const MAX_AGE = 45;
const MAX_VALUE = 550;

const INTEGER = /^\d+$/;
const DECIMAL = /^(\d+)(?:[.,](\d{1,2}))?$/;

type ParseResult = { value: string } | { error: string };

// Faixa de idade da API: inteiros de 16 a 45.
export function parseAge(text: string): ParseResult {
  const age = Number(text);
  if (!INTEGER.test(text) || age < MIN_AGE || age > MAX_AGE) {
    return { error: `Use idades inteiras de ${MIN_AGE} a ${MAX_AGE}.` };
  }
  return { value: String(age) };
}

// Faixa de valor da API: de 0 a 550, até 2 casas, enviada com ponto (10.5).
export function parseMoney(text: string): ParseResult {
  const match = DECIMAL.exec(text);
  if (!match) {
    return { error: 'Use um valor com até 2 casas, como 10,50.' };
  }
  const value = `${Number(match[1])}${match[2] ? `.${match[2]}` : ''}`;
  if (Number(value) > MAX_VALUE) {
    return { error: `O valor vai até ${formatMoney(MAX_VALUE)}.` };
  }
  return { value };
}

export function formatAge(value: string): string {
  return value;
}

export function formatMoneyText(value: string): string {
  return formatMoney(Number(value));
}
