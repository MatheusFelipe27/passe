import { money } from '../../../common/money/money';
import {
  calculatePurchaseCost,
  calculatePurchaseFee,
  fitsCashLimit,
} from './purchase';

describe('calculatePurchaseFee', () => {
  it.each([
    ['1.00', '0.00'],
    ['28.00', '0.00'],
    ['29.99', '0.00'],
    ['30.00', '0.00'],
    ['30.01', '1.50'],
    ['37.00', '1.85'],
    ['47.62', '2.38'],
    ['48.00', '2.40'],
    ['40.10', '2.01'],
    ['40.30', '2.02'],
    ['40.29', '2.01'],
    ['550.00', '27.50'],
  ])('valor de mercado %s → taxa %s', (marketValue, fee) => {
    expect(calculatePurchaseFee(money(marketValue)).toFixed(2)).toBe(fee);
  });
});

describe('calculatePurchaseCost', () => {
  it.each([
    ['28.00', '0.00', '28.00'],
    ['30.01', '1.50', '31.51'],
    ['37.00', '1.85', '38.85'],
    ['47.62', '2.38', '50.00'],
  ])('%s + %s = %s', (marketValue, fee, cost) => {
    expect(
      calculatePurchaseCost(money(marketValue), money(fee)).toFixed(2),
    ).toBe(cost);
  });
});

describe('fitsCashLimit', () => {
  it.each([
    ['28.00', '300.00', true],
    ['30.00', '300.00', true],
    ['150.00', '300.00', true],
    ['150.01', '300.00', false],
    ['49.99', '100.00', true],
    ['50.00', '100.00', true],
    ['50.01', '100.00', false],
    ['50.40', '100.00', false],
    ['130.57', '261.15', true],
    ['130.58', '261.15', false],
    ['0.50', '1.00', true],
    ['0.51', '1.00', false],
    ['1.00', '0.00', false],
  ])('custo %s com caixa %s → %s', (cost, cash, fits) => {
    expect(fitsCashLimit(money(cost), money(cash))).toBe(fits);
  });
});
