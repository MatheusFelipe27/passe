import { isLoyaltyEndAllowed } from './loyalty-window';

const NOW = new Date('2026-11-02T13:15:30.500Z');
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

function after(ms: number): Date {
  return new Date(NOW.getTime() + ms);
}

describe('isLoyaltyEndAllowed', () => {
  it.each([
    ['1 dia antes', after(-DAY), false],
    ['1 ms antes', after(-1), false],
    ['no próprio momento da compra', after(0), false],
    ['1 ms depois', after(1), true],
    ['1 minuto depois', after(MINUTE), true],
    ['120 dias depois', after(120 * DAY), true],
    ['1.095 dias menos 1 ms depois', after(1095 * DAY - 1), true],
    ['exatamente 1.095 dias depois', after(1095 * DAY), true],
    ['1.095 dias e 1 ms depois', after(1095 * DAY + 1), false],
    ['1.095 dias e 1 minuto depois', after(1095 * DAY + MINUTE), false],
    ['1.096 dias depois', after(1096 * DAY), false],
  ])('fim da fidelidade %s → %s', (_, loyaltyUntil, allowed) => {
    expect(isLoyaltyEndAllowed(loyaltyUntil, NOW)).toBe(allowed);
  });
});
