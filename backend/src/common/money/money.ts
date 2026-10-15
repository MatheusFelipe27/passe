import Decimal from 'decimal.js';

const MONEY_DECIMAL_PLACES = 2;

export type Money = Decimal;

export function money(value: Decimal.Value): Money {
  return new Decimal(value);
}

// Premissas: 2 casas, com o meio arredondado para longe do zero (14,775 → 14,78).
export function roundMoney(value: Decimal): Money {
  return value.toDecimalPlaces(MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}

// Valores em moedas nas mensagens de recusa: 2 casas e vírgula decimal (130,58).
export function formatMoneyText(value: Money): string {
  return roundMoney(value).toFixed(MONEY_DECIMAL_PLACES).replace('.', ',');
}
