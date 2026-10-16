import { Money, money, roundMoney } from '../../../common/money/money';

export const TRANSACTION_TYPES = ['COMPRA', 'VENDA'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export interface TransactionAmounts {
  type: TransactionType;
  value: Money;
  fee: Money;
  penalty: Money;
  profit: Money | null;
  cashChange: Money;
}

export interface TransactionSummary {
  totalSpent: Money;
  totalReceived: Money;
  totalFees: Money;
  totalPenalties: Money;
  totalProfit: Money;
}

// RN17: totais das transações filtradas, somados em decimal exato e arredondados para 2 casas.
export function summarizeTransactions(
  transactions: TransactionAmounts[],
): TransactionSummary {
  const purchases = transactions.filter((item) => item.type === 'COMPRA');
  const sales = transactions.filter((item) => item.type === 'VENDA');
  return {
    totalSpent: sum(purchases.map((item) => item.value.plus(item.fee))),
    totalReceived: sum(sales.map((item) => item.cashChange)),
    totalFees: sum(transactions.map((item) => item.fee)),
    totalPenalties: sum(sales.map((item) => item.penalty)),
    totalProfit: sum(sales.map((item) => item.profit ?? money(0))),
  };
}

function sum(values: Money[]): Money {
  return roundMoney(
    values.reduce((total, value) => total.plus(value), money(0)),
  );
}
