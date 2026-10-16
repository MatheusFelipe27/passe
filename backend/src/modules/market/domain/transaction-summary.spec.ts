import { money } from '../../../common/money/money';
import {
  summarizeTransactions,
  TransactionAmounts,
} from './transaction-summary';

// As duas transações do exemplo 2.3.3: a compra e a venda do Meia Lua.
const PURCHASE: TransactionAmounts = {
  type: 'COMPRA',
  value: money('37.00'),
  fee: money('1.85'),
  penalty: money('0.00'),
  profit: null,
  cashChange: money('-38.85'),
};

const SALE: TransactionAmounts = {
  type: 'VENDA',
  value: money('40.00'),
  fee: money('0.30'),
  penalty: money('4.00'),
  profit: money('3.00'),
  cashChange: money('35.70'),
};

const LOSS: TransactionAmounts = {
  type: 'VENDA',
  value: money('42.50'),
  fee: money('0.00'),
  penalty: money('8.50'),
  profit: money('-7.50'),
  cashChange: money('34.00'),
};

function totals(transactions: TransactionAmounts[]) {
  const summary = summarizeTransactions(transactions);
  return [
    summary.totalSpent,
    summary.totalReceived,
    summary.totalFees,
    summary.totalPenalties,
    summary.totalProfit,
  ].map((value) => value.toFixed(2));
}

describe('summarizeTransactions', () => {
  it('sem transações, todos os totais são 0,00', () => {
    expect(totals([])).toEqual(['0.00', '0.00', '0.00', '0.00', '0.00']);
  });

  it('reproduz o summary do exemplo 2.3.3 sem filtro', () => {
    expect(totals([SALE, PURCHASE])).toEqual([
      '38.85',
      '35.70',
      '2.15',
      '4.00',
      '3.00',
    ]);
  });

  it('com só a venda (type=VENDA), não há gasto', () => {
    expect(totals([SALE])).toEqual(['0.00', '35.70', '0.30', '4.00', '3.00']);
  });

  it('com só a compra (type=COMPRA), não há recebido, multa nem lucro', () => {
    expect(totals([PURCHASE])).toEqual([
      '38.85',
      '0.00',
      '1.85',
      '0.00',
      '0.00',
    ]);
  });

  it('soma o lucro com sinal, inclusive o prejuízo', () => {
    expect(totals([SALE, LOSS])).toEqual([
      '0.00',
      '69.70',
      '0.30',
      '12.50',
      '-4.50',
    ]);
  });

  it('soma valores que em ponto flutuante dariam erro', () => {
    const tiny = (value: string): TransactionAmounts => ({
      ...PURCHASE,
      value: money(value),
      fee: money('0.00'),
    });

    expect(totals([tiny('0.10'), tiny('0.20')])[0]).toBe('0.30');
  });
});
