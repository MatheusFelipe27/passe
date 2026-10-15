import {
  calculatePenaltyRate,
  calculateRemainingDays,
} from './loyalty-penalty';

const NOW = new Date('2026-11-05T19:40:00.000Z');
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function after(ms: number): Date {
  return new Date(NOW.getTime() + ms);
}

describe('calculateRemainingDays', () => {
  it.each([
    ['já passou um dia', -DAY, 0],
    ['já passou 1 ms', -1, 0],
    ['é o próprio momento', 0, 0],
    ['falta 1 ms', 1, 1],
    ['faltam 10 dias e 2 horas', 10 * DAY + 2 * HOUR, 11],
    ['faltam exatamente 30 dias', 30 * DAY, 30],
    ['faltam 30 dias e 1 minuto', 30 * DAY + MINUTE, 31],
    ['faltam exatamente 180 dias', 180 * DAY, 180],
    ['faltam 180 dias e 1 minuto', 180 * DAY + MINUTE, 181],
    ['faltam 200 dias', 200 * DAY, 200],
    [
      'faltam 116 dias, 17 horas e 35 minutos',
      116 * DAY + 17 * HOUR + 35 * MINUTE,
      117,
    ],
  ])('%s: %i dias', (_description, offset, days) => {
    expect(calculateRemainingDays(after(offset), NOW)).toBe(days);
  });
});

describe('calculatePenaltyRate', () => {
  it.each([
    [0, 0],
    [1, 5],
    [2, 5],
    [29, 5],
    [30, 5],
    [31, 10],
    [32, 10],
    [179, 10],
    [180, 10],
    [181, 20],
    [182, 20],
    [1095, 20],
  ])('%i dias restantes: %i%%', (days, rate) => {
    expect(calculatePenaltyRate(days)).toBe(rate);
  });
});
