import { money } from '../../../common/money/money';
import { calculateMarketValue } from './market-value';
import { Condition } from './player.types';

type MarketValueCase = [string, Condition, number, number, string];

function marketValueOf([
  baseValue,
  condition,
  agility,
  age,
]: MarketValueCase): string {
  return calculateMarketValue({
    baseValue: money(baseValue),
    condition,
    agility,
    age,
  }).toFixed(2);
}

describe('calculateMarketValue', () => {
  it.each<MarketValueCase>([
    ['82.00', 'APTO', 20, 25, '82.00'],
    ['82.00', 'APTO', 50, 19, '90.20'],
    ['82.00', 'MAL_CONDICIONADO', 50, 25, '69.70'],
    ['82.00', 'MAL_CONDICIONADO', 80, 21, '84.05'],
    ['82.00', 'MAL_CONDICIONADO', 30, 33, '53.30'],
    ['82.00', 'DOENTE', 90, 25, '69.70'],
    ['82.00', 'DOENTE', 30, 25, '49.20'],
    ['82.00', 'DOENTE', 10, 40, '49.20'],
    ['9.50', 'MAL_CONDICIONADO', 85, 25, '8.79'],
    ['1.00', 'MAL_CONDICIONADO', 50, 35, '1.00'],
  ])('exemplos da RN05: %s %s agilidade %i idade %i → %s', (...testCase) => {
    expect(marketValueOf(testCase)).toBe(testCase[4]);
  });

  it.each<MarketValueCase>([
    ['100.00', 'MAL_CONDICIONADO', 79, 25, '85.00'],
    ['100.00', 'MAL_CONDICIONADO', 80, 25, '92.50'],
    ['100.00', 'MAL_CONDICIONADO', 100, 25, '92.50'],
    ['100.00', 'MAL_CONDICIONADO', 31, 25, '85.00'],
    ['100.00', 'MAL_CONDICIONADO', 30, 25, '75.00'],
    ['100.00', 'MAL_CONDICIONADO', 1, 25, '75.00'],
    ['100.00', 'APTO', 1, 25, '100.00'],
    ['100.00', 'APTO', 100, 25, '100.00'],
  ])(
    'limites da agilidade: %s %s agilidade %i idade %i → %s',
    (...testCase) => {
      expect(marketValueOf(testCase)).toBe(testCase[4]);
    },
  );

  it.each<MarketValueCase>([
    ['100.00', 'DOENTE', 79, 25, '70.00'],
    ['100.00', 'DOENTE', 80, 25, '85.00'],
    ['100.00', 'DOENTE', 100, 25, '85.00'],
    ['100.00', 'DOENTE', 31, 25, '70.00'],
    ['100.00', 'DOENTE', 30, 25, '60.00'],
    ['100.00', 'DOENTE', 1, 25, '60.00'],
  ])(
    'limites da agilidade em DOENTE: %s %s agilidade %i idade %i → %s',
    (...testCase) => {
      expect(marketValueOf(testCase)).toBe(testCase[4]);
    },
  );

  it.each<MarketValueCase>([
    ['100.00', 'APTO', 50, 16, '110.00'],
    ['100.00', 'APTO', 50, 21, '110.00'],
    ['100.00', 'APTO', 50, 22, '100.00'],
    ['100.00', 'APTO', 50, 31, '100.00'],
    ['100.00', 'APTO', 50, 32, '90.00'],
    ['100.00', 'APTO', 50, 45, '90.00'],
    ['100.00', 'MAL_CONDICIONADO', 50, 21, '95.00'],
    ['100.00', 'MAL_CONDICIONADO', 50, 32, '75.00'],
    ['100.00', 'DOENTE', 50, 21, '80.00'],
    ['100.00', 'DOENTE', 50, 32, '60.00'],
  ])('limites da idade: %s %s agilidade %i idade %i → %s', (...testCase) => {
    expect(marketValueOf(testCase)).toBe(testCase[4]);
  });

  it.each<MarketValueCase>([
    ['100.00', 'MAL_CONDICIONADO', 30, 32, '65.00'],
    ['100.00', 'DOENTE', 30, 31, '60.00'],
    ['100.00', 'DOENTE', 30, 32, '60.00'],
    ['100.00', 'DOENTE', 30, 21, '70.00'],
  ])('teto de -40%%: %s %s agilidade %i idade %i → %s', (...testCase) => {
    expect(marketValueOf(testCase)).toBe(testCase[4]);
  });

  it.each<MarketValueCase>([
    ['1.00', 'APTO', 50, 25, '1.00'],
    ['1.00', 'APTO', 50, 32, '1.00'],
    ['1.11', 'APTO', 50, 32, '1.00'],
    ['1.12', 'APTO', 50, 32, '1.01'],
    ['1.66', 'DOENTE', 30, 40, '1.00'],
    ['1.67', 'DOENTE', 30, 40, '1.00'],
    ['1.68', 'DOENTE', 30, 40, '1.01'],
  ])('piso de 1,00: %s %s agilidade %i idade %i → %s', (...testCase) => {
    expect(marketValueOf(testCase)).toBe(testCase[4]);
  });

  it.each<MarketValueCase>([
    ['9.50', 'MAL_CONDICIONADO', 50, 25, '8.08'],
    ['9.53', 'MAL_CONDICIONADO', 50, 25, '8.10'],
    ['9.54', 'MAL_CONDICIONADO', 50, 25, '8.11'],
    ['0.10', 'APTO', 50, 25, '1.00'],
    ['550.00', 'APTO', 50, 21, '605.00'],
  ])(
    'arredonda uma vez, no fim: %s %s agilidade %i idade %i → %s',
    (...testCase) => {
      expect(marketValueOf(testCase)).toBe(testCase[4]);
    },
  );

  it.each<MarketValueCase>([
    ['46.00', 'DOENTE', 20, 34, '27.60'],
    ['1.50', 'DOENTE', 50, 36, '1.00'],
    ['9.50', 'MAL_CONDICIONADO', 25, 22, '7.13'],
  ])(
    'teto, piso e arredondamento: %s %s agilidade %i idade %i → %s',
    (...testCase) => {
      expect(marketValueOf(testCase)).toBe(testCase[4]);
    },
  );
});
