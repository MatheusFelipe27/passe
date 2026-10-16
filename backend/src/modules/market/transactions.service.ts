import { Injectable, NotFoundException } from '@nestjs/common';
import { Club, Transaction } from '../../generated/prisma/client';
import { PlayersRepository } from '../players/players.repository';
import { summarizeTransactions } from './domain/transaction-summary';
import { toTransactionsCsv } from './domain/transactions-csv';
import { ListTransactionsQuery } from './dto/list-transactions.query';
import { MarketRepository } from './market.repository';
import {
  toCsvTransaction,
  toSummaryView,
  toTransactionView,
  TransactionHistoryView,
} from './market.view';

export interface TransactionsCsvFile {
  fileName: string;
  content: string;
}

@Injectable()
export class TransactionsService {
  constructor(
    private readonly market: MarketRepository,
    private readonly players: PlayersRepository,
  ) {}

  // RN17: as transações como foram gravadas, com o resumo das que passaram nos filtros.
  async history(
    clubId: number,
    query: ListTransactionsQuery,
  ): Promise<TransactionHistoryView> {
    const { transactions } = await this.load(clubId, query);
    return {
      data: transactions.map(toTransactionView),
      summary: toSummaryView(
        summarizeTransactions(transactions.map(toCsvTransaction)),
      ),
    };
  }

  // RN18: o mesmo histórico, com os mesmos filtros e a mesma ordem, em CSV.
  async exportCsv(
    clubId: number,
    query: ListTransactionsQuery,
  ): Promise<TransactionsCsvFile> {
    const { club, transactions } = await this.load(clubId, query);
    return {
      fileName: `transacoes-${club.acronym}.csv`,
      content: toTransactionsCsv(transactions.map(toCsvTransaction)),
    };
  }

  // Clube inexistente → 404; jogador do filtro inexistente ou excluído → 404 (V8).
  private async load(
    clubId: number,
    query: ListTransactionsQuery,
  ): Promise<{ club: Club; transactions: Transaction[] }> {
    const club = await this.market.findClub(clubId);
    if (!club) {
      throw new NotFoundException('Clube não encontrado.');
    }
    if (
      query.playerId !== undefined &&
      !(await this.players.findActiveById(query.playerId))
    ) {
      throw new NotFoundException('Jogador não encontrado.');
    }
    const transactions = await this.market.findTransactions(clubId, query);
    return { club, transactions };
  }
}
