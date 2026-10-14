import { describe, expect, it } from 'vitest';
import { formatMoneyText, parseAge, parseMoney } from './range-parsers';

describe('parseAge', () => {
  it.each([
    ['16', '16'],
    ['17', '17'],
    ['44', '44'],
    ['45', '45'],
    ['016', '16'],
  ])('aceita %s como %s', (text, expected) => {
    expect(parseAge(text)).toEqual({ value: expected });
  });

  it.each(['15', '46', '0', '-1', '20.5', '20,5', 'abc', '1e1'])(
    'recusa %s',
    (text) => {
      expect(parseAge(text)).toEqual({
        error: 'Use idades inteiras de 16 a 45.',
      });
    },
  );
});

describe('parseMoney', () => {
  it.each([
    ['0', '0'],
    ['10', '10'],
    ['10,5', '10.5'],
    ['10.5', '10.5'],
    ['10,55', '10.55'],
    ['010', '10'],
    ['0,5', '0.5'],
    ['549,99', '549.99'],
    ['550', '550'],
    ['550,00', '550.00'],
  ])('aceita %s como %s', (text, expected) => {
    expect(parseMoney(text)).toEqual({ value: expected });
  });

  it.each(['10,555', '-1', '1e2', 'abc', '10,', ',5', '1.000,00'])(
    'recusa o formato %s',
    (text) => {
      expect(parseMoney(text)).toEqual({
        error: 'Use um valor com até 2 casas, como 10,50.',
      });
    },
  );

  it.each(['550,01', '551'])('recusa %s, acima de 550', (text) => {
    expect(parseMoney(text)).toEqual({ error: 'O valor vai até 550,00.' });
  });
});

describe('formatMoneyText', () => {
  it.each([
    ['10.5', '10,50'],
    ['0', '0,00'],
    ['550', '550,00'],
  ])('mostra %s como %s', (value, expected) => {
    expect(formatMoneyText(value)).toBe(expected);
  });
});
