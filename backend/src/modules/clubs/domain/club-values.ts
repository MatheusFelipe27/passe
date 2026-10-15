import { Money, money, roundMoney } from '../../../common/money/money';

// RN11: valor do elenco = soma dos valores de mercado dos jogadores do clube.
export function calculateSquadValue(marketValues: Money[]): Money {
  return roundMoney(
    marketValues.reduce((total, value) => total.plus(value), money(0)),
  );
}

// RN11: patrimônio = caixa + valor do elenco.
export function calculateNetWorth(cash: Money, squadValue: Money): Money {
  return roundMoney(cash.plus(squadValue));
}
