import Decimal from 'decimal.js';
import { Money, money, roundMoney } from '../../../common/money/money';

// RN15: a multa é limitada a 10,00.
const PENALTY_CAP = money('10.00');

// RN16: comissão progressiva sobre o lucro: 10% até 10,00 e 20% sobre o que passar.
const COMMISSION_FIRST_BAND = money('10.00');
const COMMISSION_FIRST_PERCENT = 10;
const COMMISSION_ABOVE_PERCENT = 20;

export type ContractEnd = 'RESCINDIDO' | 'ENCERRADO';

// RN15: multa = valor de mercado na venda × percentual, arredondada e com teto.
export function calculatePenalty(marketValue: Money, rate: number): Money {
  return Decimal.min(
    roundMoney(marketValue.times(rate).dividedBy(100)),
    PENALTY_CAP,
  );
}

// RN16: lucro = valor de mercado na venda − valor de compra (sem a taxa).
export function calculateProfit(
  marketValue: Money,
  purchaseValue: Money,
): Money {
  return marketValue.minus(purchaseValue);
}

// RN16: as duas faixas são somadas e arredondadas uma única vez; sem lucro, 0,00.
export function calculateCommission(profit: Money): Money {
  if (!profit.greaterThan(0)) {
    return money(0);
  }
  const firstBand = Decimal.min(profit, COMMISSION_FIRST_BAND);
  const above = Decimal.max(profit.minus(COMMISSION_FIRST_BAND), 0);
  return roundMoney(
    firstBand
      .times(COMMISSION_FIRST_PERCENT)
      .plus(above.times(COMMISSION_ABOVE_PERCENT))
      .dividedBy(100),
  );
}

// RN16: crédito no caixa = valor de mercado − multa − comissão.
export function calculateSaleCredit(
  marketValue: Money,
  penalty: Money,
  commission: Money,
): Money {
  return marketValue.minus(penalty).minus(commission);
}

// RN15: com multa, o contrato é rescindido; com a fidelidade cumprida, encerrado.
export function contractEndAfterSale(penalty: Money): ContractEnd {
  return penalty.greaterThan(0) ? 'RESCINDIDO' : 'ENCERRADO';
}
