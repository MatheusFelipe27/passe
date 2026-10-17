import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { formatMoneyText, money } from '../../common/money/money';
import { Clock } from '../../common/time/clock';
import { Player } from '../../generated/prisma/client';
import { DbClient, TransactionRunner } from '../../prisma/transaction-runner';
import { ClubsRepository } from '../clubs/clubs.repository';
import { LineupsRepository } from '../lineups/lineups.repository';
import { marketValueOf } from '../players/player.view';
import { PlayersRepository } from '../players/players.repository';
import {
  calculatePenaltyRate,
  calculateRemainingDays,
} from './domain/loyalty-penalty';
import { isLoyaltyEndAllowed, MAX_LOYALTY_DAYS } from './domain/loyalty-window';
import {
  calculatePurchaseCost,
  calculatePurchaseFee,
  fitsCashLimit,
} from './domain/purchase';
import {
  calculateCommission,
  calculatePenalty,
  calculateProfit,
  calculateSaleCredit,
  contractEndAfterSale,
} from './domain/sale';
import { BuyPlayerInput } from './dto/buy-player.schema';
import { MarketRepository } from './market.repository';
import {
  PurchaseView,
  SaleView,
  toPurchaseView,
  toSaleView,
} from './market.view';

// RN14: no máximo 12 jogadores por clube.
const MAX_SQUAD = 12;

@Injectable()
export class MarketService {
  constructor(
    private readonly market: MarketRepository,
    private readonly clubs: ClubsRepository,
    private readonly players: PlayersRepository,
    private readonly lineups: LineupsRepository,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  // RN12 a RN14: tudo numa única operação, com o jogador e o clube travados até o fim.
  buy(playerId: number, input: BuyPlayerInput): Promise<PurchaseView> {
    const now = this.clock.now();
    return this.transactions.run(async (db) => {
      if (!isLoyaltyEndAllowed(input.loyaltyUntil, now)) {
        throw new BadRequestException(
          `loyalty_until: deve ser depois do momento da compra e até ${MAX_LOYALTY_DAYS} dias depois dele`,
        );
      }
      const player = await this.lockPlayer(playerId, db);
      const club = await this.clubs.lock(input.clubId, db);
      if (!club) {
        throw new NotFoundException('Clube não encontrado.');
      }
      if (player.clubId !== null) {
        throw new ConflictException(
          'O jogador já tem clube: só jogador livre pode ser comprado.',
        );
      }
      if (await this.market.hasSold(club.id, player.id, db)) {
        throw new ConflictException(
          `O ${club.name} já vendeu este jogador e não pode comprá-lo de novo.`,
        );
      }
      if ((await this.market.countSquad(club.id, db)) >= MAX_SQUAD) {
        throw new ConflictException(
          `O elenco do ${club.name} já tem ${MAX_SQUAD} jogadores, o máximo permitido.`,
        );
      }

      const marketValue = marketValueOf(player);
      const fee = calculatePurchaseFee(marketValue);
      const cost = calculatePurchaseCost(marketValue, fee);
      const cash = money(club.cash.toString());
      if (!fitsCashLimit(cost, cash)) {
        throw new ConflictException(
          `O custo da compra (${formatMoneyText(cost)}) passa de 50% do caixa do ${club.name} (${formatMoneyText(cash)}).`,
        );
      }

      const newCash = cash.minus(cost);
      await this.market.setCash(club.id, newCash, db);
      await this.market.setPlayerClub(player.id, club.id, db);
      const contract = await this.market.createContract(
        {
          playerId: player.id,
          clubId: club.id,
          purchaseValue: marketValue,
          loyaltyUntil: input.loyaltyUntil,
          startedAt: now,
        },
        db,
      );
      const transaction = await this.market.createTransaction(
        {
          clubId: club.id,
          playerId: player.id,
          playerName: player.name,
          type: 'COMPRA',
          value: marketValue,
          fee,
          penalty: money(0),
          profit: null,
          cashChange: cost.negated(),
          createdAt: now,
        },
        db,
      );
      return toPurchaseView(transaction, contract, newCash);
    });
  }

  // RN15 e RN16: a venda é feita pelo clube atual do jogador, numa única operação.
  sell(playerId: number): Promise<SaleView> {
    const now = this.clock.now();
    return this.transactions.run(async (db) => {
      const player = await this.lockPlayer(playerId, db);
      if (player.clubId === null) {
        throw new ConflictException('Jogador livre não pode ser vendido.');
      }
      const club = await this.clubs.lock(player.clubId, db);
      const contract = await this.market.findActiveContract(
        player.id,
        player.clubId,
        db,
      );
      if (!club || !contract) {
        throw new Error(
          `Jogador ${player.id} está no clube ${player.clubId} sem contrato ATIVO.`,
        );
      }

      const marketValue = marketValueOf(player);
      const purchaseValue = money(contract.purchaseValue.toString());
      const remainingDays = calculateRemainingDays(contract.loyaltyUntil, now);
      const penaltyRate = calculatePenaltyRate(remainingDays);
      const penalty = calculatePenalty(marketValue, penaltyRate);
      const profit = calculateProfit(marketValue, purchaseValue);
      const commission = calculateCommission(profit);
      const credit = calculateSaleCredit(marketValue, penalty, commission);
      const contractStatus = contractEndAfterSale(penalty);

      const newCash = money(club.cash.toString()).plus(credit);
      await this.market.setCash(club.id, newCash, db);
      await this.market.setPlayerClub(player.id, null, db);
      await this.market.endContract(contract.id, contractStatus, now, db);
      // RN19: o titular vendido sai da escalação na mesma operação.
      await this.lineups.removePlayer(player.id, db);
      const transaction = await this.market.createTransaction(
        {
          clubId: club.id,
          playerId: player.id,
          playerName: player.name,
          type: 'VENDA',
          value: marketValue,
          fee: commission,
          penalty,
          profit,
          cashChange: credit,
          createdAt: now,
        },
        db,
      );
      return toSaleView(
        transaction,
        { purchaseValue, remainingDays, penaltyRate, contractStatus },
        newCash,
      );
    });
  }

  private async lockPlayer(id: number, db: DbClient): Promise<Player> {
    const player = await this.players.lockActiveById(id, db);
    if (!player) {
      throw new NotFoundException('Jogador não encontrado.');
    }
    return player;
  }
}
