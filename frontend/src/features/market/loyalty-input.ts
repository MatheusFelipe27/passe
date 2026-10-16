const DAY_MS = 24 * 60 * 60 * 1000;

// Limites do loyalty_until: depois do momento da compra e até 1.095 dias depois dele.
export const MAX_LOYALTY_DAYS = 1095;

const DATE_INPUT = /^\d{4}-\d{2}-\d{2}$/;
const TIME_INPUT = /^\d{2}:\d{2}$/;

// RN01: a data e a hora digitadas são do horário de Brasília e vão com o fuso -03:00.
export function toLoyaltyUntil(date: string, time: string): string {
  return `${date}T${time}-03:00`;
}

export function loyaltyInstant(date: string, time: string): number {
  if (!DATE_INPUT.test(date) || !TIME_INPUT.test(time)) {
    return Number.NaN;
  }
  return Date.parse(`${date}T${time}:00-03:00`);
}

export function isWithinLoyaltyWindow(instant: number, now: number): boolean {
  const remainingMs = instant - now;
  return remainingMs > 0 && remainingMs <= MAX_LOYALTY_DAYS * DAY_MS;
}
