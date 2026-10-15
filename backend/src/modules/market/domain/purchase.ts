import { Money, money, roundMoney } from '../../../common/money/money';

// RN13: taxa de 5% do valor de mercado, só quando ele passa de 30,00.
const FEE_PERCENT = 5;
const FEE_FREE_UP_TO = money('30.00');

export function calculatePurchaseFee(marketValue: Money): Money {
  if (!marketValue.greaterThan(FEE_FREE_UP_TO)) {
    return money(0);
  }
  return roundMoney(marketValue.times(FEE_PERCENT).dividedBy(100));
}

// RN13: custo total = valor de mercado + taxa.
export function calculatePurchaseCost(marketValue: Money, fee: Money): Money {
  return marketValue.plus(fee);
}

// RN13: o custo pode ser no máximo a metade exata do caixa, sem arredondar (custo × 2 ≤ caixa).
export function fitsCashLimit(cost: Money, cash: Money): boolean {
  return cost.times(2).lessThanOrEqualTo(cash);
}
