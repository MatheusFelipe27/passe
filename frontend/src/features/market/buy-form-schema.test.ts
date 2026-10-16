import { describe, expect, it } from 'vitest';
import { buyFormSchema, LOYALTY_WINDOW_MESSAGE } from './buy-form-schema';
import {
  isWithinLoyaltyWindow,
  loyaltyInstant,
  toLoyaltyUntil,
} from './loyalty-input';

// 2026-11-02, 10:15:30 em Brasília.
const NOW = Date.parse('2026-11-02T10:15:30-03:00');

function errorsOf(values: { clubId?: string; date?: string; time?: string }) {
  const result = buyFormSchema(NOW).safeParse({
    clubId: '1',
    date: '2027-03-02',
    time: '10:15',
    ...values,
  });
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
}

describe('toLoyaltyUntil', () => {
  it('monta o formato da RN01 com o fuso de Brasília', () => {
    expect(toLoyaltyUntil('2027-03-02', '10:15')).toBe(
      '2027-03-02T10:15-03:00',
    );
  });
});

describe('loyaltyInstant', () => {
  it('lê a data e a hora no horário de Brasília', () => {
    expect(new Date(loyaltyInstant('2027-03-02', '10:15')).toISOString()).toBe(
      '2027-03-02T13:15:00.000Z',
    );
  });

  it.each([
    ['', '10:15'],
    ['2027-03-02', ''],
    ['02/03/2027', '10:15'],
    ['2027-03-02', '10h15'],
  ])('não lê %s %s', (date, time) => {
    expect(loyaltyInstant(date, time)).toBeNaN();
  });
});

describe('isWithinLoyaltyWindow', () => {
  const DAY = 24 * 60 * 60 * 1000;

  it.each([
    ['1 ms antes', -1, false],
    ['agora', 0, false],
    ['1 ms depois', 1, true],
    ['1.095 dias depois', 1095 * DAY, true],
    ['1.095 dias e 1 ms depois', 1095 * DAY + 1, false],
  ])('%s → %s', (_, offset, allowed) => {
    expect(isWithinLoyaltyWindow(NOW + offset, NOW)).toBe(allowed);
  });
});

describe('buyFormSchema', () => {
  it('aceita o pedido do exemplo', () => {
    expect(errorsOf({})).toEqual({});
  });

  it.each([
    ['clube', { clubId: '' }, 'clubId', 'Escolha o clube comprador.'],
    ['data', { date: '' }, 'date', 'Informe a data.'],
    ['hora', { time: '' }, 'time', 'Informe a hora.'],
  ])('pede %s', (_, values, field, message) => {
    expect(errorsOf(values)[field]).toBe(message);
  });

  it.each([
    [
      'no minuto anterior a agora',
      '2026-11-02',
      '10:15',
      LOYALTY_WINDOW_MESSAGE,
    ],
    ['ontem', '2026-11-01', '10:15', LOYALTY_WINDOW_MESSAGE],
    ['no minuto seguinte a agora', '2026-11-02', '10:16', undefined],
    [
      'daqui a 1.095 dias, um pouco antes do limite',
      '2029-11-01',
      '10:15',
      undefined,
    ],
    [
      'daqui a 1.095 dias e 1 minuto',
      '2029-11-01',
      '10:16',
      LOYALTY_WINDOW_MESSAGE,
    ],
    ['daqui a 1.096 dias', '2029-11-02', '10:15', LOYALTY_WINDOW_MESSAGE],
  ])('fim da fidelidade %s', (_, date, time, message) => {
    expect(errorsOf({ date, time }).date).toBe(message);
  });

  it('a mensagem da janela fala de 1.095 dias', () => {
    expect(LOYALTY_WINDOW_MESSAGE).toBe(
      'Escolha um fim depois de agora e até 1.095 dias.',
    );
  });
});
