import { Injectable } from '@nestjs/common';
import { Money } from '../../common/money/money';
import { Club, Contract, Transaction } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DbClient } from '../../prisma/transaction-runner';
import { ContractEnd } from './domain/sale';
import { TransactionType } from './domain/transaction-summary';

export interface NewTransaction {
  clubId: number;
  playerId: number;
  playerName: string;
  type: TransactionType;
  value: Money;
  fee: Money;
  penalty: Money;
  profit: Money | null;
  cashChange: Money;
  createdAt: Date;
}

export interface NewContract {
  playerId: number;
  clubId: number;
  purchaseValue: Money;
  loyaltyUntil: Date;
  startedAt: Date;
}

export interface TransactionFilter {
  types?: TransactionType[];
  playerId?: number;
}

@Injectable()
export class MarketRepository {
  constructor(private readonly prisma: PrismaService) {}

  findClub(id: number): Promise<Club | null> {
    return this.prisma.club.findUnique({ where: { id } });
  }

  // RN17: da mais recente para a mais antiga; no empate de data e hora, o id decrescente.
  findTransactions(
    clubId: number,
    filter: TransactionFilter,
  ): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        clubId,
        playerId: filter.playerId,
        type: filter.types ? { in: filter.types } : undefined,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  // Trava o clube até o fim da transação: o caixa e o elenco não mudam no meio da operação.
  async lockClub(id: number, db: DbClient): Promise<Club | null> {
    const locked = await db.$queryRaw<{ id: number }[]>`
      SELECT id FROM clubes WHERE id = ${id} FOR UPDATE`;
    return locked.length > 0 ? db.club.findUnique({ where: { id } }) : null;
  }

  countSquad(clubId: number, db: DbClient): Promise<number> {
    return db.player.count({ where: { clubId, deletedAt: null } });
  }

  async hasSold(
    clubId: number,
    playerId: number,
    db: DbClient,
  ): Promise<boolean> {
    const sales = await db.transaction.count({
      where: { clubId, playerId, type: 'VENDA' },
    });
    return sales > 0;
  }

  findActiveContract(
    playerId: number,
    clubId: number,
    db: DbClient,
  ): Promise<Contract | null> {
    return db.contract.findFirst({
      where: { playerId, clubId, status: 'ATIVO' },
    });
  }

  async setCash(clubId: number, cash: Money, db: DbClient): Promise<void> {
    await db.club.update({
      where: { id: clubId },
      data: { cash: cash.toFixed(2) },
    });
  }

  async setPlayerClub(
    playerId: number,
    clubId: number | null,
    db: DbClient,
  ): Promise<void> {
    await db.player.update({ where: { id: playerId }, data: { clubId } });
  }

  createContract(contract: NewContract, db: DbClient): Promise<Contract> {
    return db.contract.create({
      data: { ...contract, purchaseValue: contract.purchaseValue.toFixed(2) },
    });
  }

  endContract(
    id: number,
    status: ContractEnd,
    endedAt: Date,
    db: DbClient,
  ): Promise<Contract> {
    return db.contract.update({ where: { id }, data: { status, endedAt } });
  }

  createTransaction(
    transaction: NewTransaction,
    db: DbClient,
  ): Promise<Transaction> {
    return db.transaction.create({
      data: {
        ...transaction,
        value: transaction.value.toFixed(2),
        fee: transaction.fee.toFixed(2),
        penalty: transaction.penalty.toFixed(2),
        profit: transaction.profit?.toFixed(2) ?? null,
        cashChange: transaction.cashChange.toFixed(2),
      },
    });
  }
}
