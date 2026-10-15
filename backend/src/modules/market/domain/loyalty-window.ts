import { DAY_MS } from '../../../common/time/brasilia-time';

// Limites do loyalty_until: depois do momento da compra e até 1.095 dias depois dele.
export const MAX_LOYALTY_DAYS = 1095;

export function isLoyaltyEndAllowed(loyaltyUntil: Date, now: Date): boolean {
  const remainingMs = loyaltyUntil.getTime() - now.getTime();
  return remainingMs > 0 && remainingMs <= MAX_LOYALTY_DAYS * DAY_MS;
}
