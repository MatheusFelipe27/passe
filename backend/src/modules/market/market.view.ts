import { Money, money } from '../../common/money/money';
import { formatBrasiliaDateTime } from '../../common/time/brasilia-time';
import { Contract, Transaction } from '../../generated/prisma/client';
import { ContractEnd } from './domain/sale';
import { TransactionType } from './market.repository';

export interface TransactionView {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: TransactionType;
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  created_at: string;
}

export interface PurchaseView extends TransactionView {
  contract: {
    purchase_value: number;
    loyalty_until: string;
    status: string;
  };
  club_cash: number;
}

export interface SaleView extends TransactionView {
  purchase_value: number;
  remaining_days: number;
  penalty_rate: number;
  contract_status: ContractEnd;
  club_cash: number;
}

export interface SaleDetails {
  purchaseValue: Money;
  remainingDays: number;
  penaltyRate: number;
  contractStatus: ContractEnd;
}

// Transação como gravada: o nome do jogador e os valores ficam como eram no momento da operação.
export function toTransactionView(transaction: Transaction): TransactionView {
  return {
    id: transaction.id,
    club_id: transaction.clubId,
    player_id: transaction.playerId,
    player_name: transaction.playerName,
    type: transaction.type as TransactionType,
    value: amount(transaction.value),
    fee: amount(transaction.fee),
    penalty: amount(transaction.penalty),
    profit: transaction.profit === null ? null : amount(transaction.profit),
    cash_change: amount(transaction.cashChange),
    created_at: formatBrasiliaDateTime(transaction.createdAt),
  };
}

export function toPurchaseView(
  transaction: Transaction,
  contract: Contract,
  clubCash: Money,
): PurchaseView {
  return {
    ...toTransactionView(transaction),
    contract: {
      purchase_value: amount(contract.purchaseValue),
      loyalty_until: formatBrasiliaDateTime(contract.loyaltyUntil),
      status: contract.status,
    },
    club_cash: clubCash.toNumber(),
  };
}

export function toSaleView(
  transaction: Transaction,
  sale: SaleDetails,
  clubCash: Money,
): SaleView {
  return {
    ...toTransactionView(transaction),
    purchase_value: sale.purchaseValue.toNumber(),
    remaining_days: sale.remainingDays,
    penalty_rate: sale.penaltyRate,
    contract_status: sale.contractStatus,
    club_cash: clubCash.toNumber(),
  };
}

function amount(value: { toString(): string }): number {
  return money(value.toString()).toNumber();
}
