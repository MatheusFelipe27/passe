import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney, formatTime } from './format';

describe('formatMoney', () => {
  it.each([
    [0, '0,00'],
    [1, '1,00'],
    [22.25, '22,25'],
    [1744.14, '1.744,14'],
  ])('%s → %s', (value, text) => {
    expect(formatMoney(value)).toBe(text);
  });
});

describe('formatDate e formatTime', () => {
  it('mostram a data e a hora como a API manda, em -03:00', () => {
    expect(formatDate('2027-04-04T15:45:00-03:00')).toBe('04/04/2027');
    expect(formatTime('2027-04-04T15:45:00-03:00')).toBe('15:45');
  });

  it.each([
    ['2026-11-08T02:59:00Z', '07/11/2026', '23:59'],
    ['2026-11-08T03:00:00Z', '08/11/2026', '00:00'],
    ['2026-12-31T23:30:00-03:00', '31/12/2026', '23:30'],
    ['2027-01-01T00:00:00-03:00', '01/01/2027', '00:00'],
  ])(
    'convertem %s para o horário de Brasília, inclusive na virada do dia',
    (instant, date, time) => {
      expect(formatDate(instant)).toBe(date);
      expect(formatTime(instant)).toBe(time);
    },
  );

  it('aceitam o instante em milissegundos', () => {
    const instant = Date.parse('2026-11-12T15:00:00-03:00');
    expect(formatDate(instant)).toBe('12/11/2026');
    expect(formatTime(instant)).toBe('15:00');
  });
});
