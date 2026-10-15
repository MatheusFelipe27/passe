import { money } from '../../../common/money/money';
import {
  calculateCommission,
  calculatePenalty,
  calculateProfit,
  calculateSaleCredit,
  contractEndAfterSale,
} from './sale';

describe('calculatePenalty', () => {
  it.each([
    ['40.00', 0, '0.00'],
    ['40.00', 5, '2.00'],
    ['40.00', 10, '4.00'],
    ['42.50', 20, '8.50'],
    ['30.00', 5, '1.50'],
    ['75.00', 20, '10.00'],
    ['49.95', 20, '9.99'],
    ['49.97', 20, '9.99'],
    ['49.98', 20, '10.00'],
    ['50.00', 20, '10.00'],
    ['50.05', 20, '10.00'],
    ['100.00', 10, '10.00'],
    ['100.10', 10, '10.00'],
    ['99.90', 10, '9.99'],
    ['550.00', 20, '10.00'],
    ['1.00', 5, '0.05'],
    ['14.77', 5, '0.74'],
    ['14.69', 5, '0.73'],
  ])('%s × %i% → %s', (marketValue, rate, penalty) => {
    expect(calculatePenalty(money(marketValue), rate).toFixed(2)).toBe(penalty);
  });
});

describe('calculateProfit', () => {
  it.each([
    ['40.00', '37.00', '3.00'],
    ['42.50', '50.00', '-7.50'],
    ['30.00', '26.15', '3.85'],
    ['25.00', '25.00', '0.00'],
    ['75.00', '60.00', '15.00'],
  ])('%s − %s = %s', (marketValue, purchaseValue, profit) => {
    expect(
      calculateProfit(money(marketValue), money(purchaseValue)).toFixed(2),
    ).toBe(profit);
  });
});

describe('calculateCommission', () => {
  it.each([
    ['3.00', '0.30'],
    ['3.85', '0.39'],
    ['3.84', '0.38'],
    ['9.99', '1.00'],
    ['10.00', '1.00'],
    ['10.01', '1.00'],
    ['10.03', '1.01'],
    ['10.02', '1.00'],
    ['15.00', '2.00'],
    ['0.01', '0.00'],
    ['0.05', '0.01'],
    ['0.00', '0.00'],
    ['-0.01', '0.00'],
    ['-7.50', '0.00'],
    ['500.00', '99.00'],
  ])('lucro %s → comissão %s', (profit, commission) => {
    expect(calculateCommission(money(profit)).toFixed(2)).toBe(commission);
  });
});

describe('calculateSaleCredit', () => {
  it.each([
    ['37.00', '40.00', '4.00', '3.00', '0.30', '35.70'],
    ['50.00', '42.50', '8.50', '-7.50', '0.00', '34.00'],
    ['26.15', '30.00', '1.50', '3.85', '0.39', '28.11'],
    ['25.00', '25.00', '0.00', '0.00', '0.00', '25.00'],
    ['60.00', '75.00', '10.00', '15.00', '2.00', '63.00'],
  ])(
    'compra %s, venda %s: multa %s, lucro %s, comissão %s, crédito %s',
    (purchase, sale, penalty, profit, commission, credit) => {
      const marketValue = money(sale);
      const computedProfit = calculateProfit(marketValue, money(purchase));
      const computedCommission = calculateCommission(computedProfit);

      expect(computedProfit.toFixed(2)).toBe(profit);
      expect(computedCommission.toFixed(2)).toBe(commission);
      expect(
        calculateSaleCredit(
          marketValue,
          money(penalty),
          computedCommission,
        ).toFixed(2),
      ).toBe(credit);
    },
  );
});

describe('contractEndAfterSale', () => {
  it.each([
    ['0.00', 'ENCERRADO'],
    ['0.05', 'RESCINDIDO'],
    ['10.00', 'RESCINDIDO'],
  ])('multa %s → %s', (penalty, status) => {
    expect(contractEndAfterSale(money(penalty))).toBe(status);
  });
});
