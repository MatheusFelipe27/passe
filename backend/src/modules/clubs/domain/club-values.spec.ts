import { money } from '../../../common/money/money';
import { calculateNetWorth, calculateSquadValue } from './club-values';

describe('calculateSquadValue', () => {
  it.each([
    [[], '0.00'],
    [['37.00'], '37.00'],
    [['81.40', '27.60', '46.00', '1.00'], '156.00'],
    [['0.10', '0.20'], '0.30'],
    [['32.00', '52.00', '40.43', '24.00', '22.25', '52.00'], '222.68'],
  ])('soma %j = %s', (values, expected) => {
    expect(
      calculateSquadValue(values.map((value) => money(value))).toFixed(2),
    ).toBe(expected);
  });
});

describe('calculateNetWorth', () => {
  it.each([
    ['300.00', '0.00', '300.00'],
    ['261.15', '37.00', '298.15'],
    ['137.63', '156.00', '293.63'],
    ['51.58', '222.68', '274.26'],
  ])('caixa %s + elenco %s = %s', (cash, squad, expected) => {
    expect(calculateNetWorth(money(cash), money(squad)).toFixed(2)).toBe(
      expected,
    );
  });
});
