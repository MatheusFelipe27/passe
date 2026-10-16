const integerFormat = new Intl.NumberFormat('pt-BR');

const moneyFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatInteger(value: number): string {
  return integerFormat.format(value);
}

// Valores em moedas: sempre 2 casas e vírgula decimal (1.744,14).
export function formatMoney(value: number): string {
  return moneyFormat.format(value);
}

const BRASILIA_TIME_ZONE = 'America/Sao_Paulo';

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: BRASILIA_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: BRASILIA_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

// Datas sempre no horário de Brasília, qualquer que seja o fuso do navegador (07/11/2026).
export function formatDate(instant: string | number): string {
  return dateFormat.format(new Date(instant));
}

export function formatTime(instant: string | number): string {
  return timeFormat.format(new Date(instant));
}

export function formatDateTime(instant: string | number): string {
  return `${formatDate(instant)}, ${formatTime(instant)}`;
}

const MINUS_SIGN = '−';

// Variação com sinal: "+" para entrada e "−" para saída; zero sem sinal.
export function formatSignedMoney(value: number): string {
  if (value === 0) {
    return formatMoney(0);
  }
  return `${value > 0 ? '+' : MINUS_SIGN}${formatMoney(Math.abs(value))}`;
}

export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? singular : plural;
}
