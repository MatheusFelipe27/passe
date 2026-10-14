import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toSortKey } from '../../common/text/text';
import { Player } from '../../generated/prisma/client';
import { DbClient, TransactionRunner } from '../../prisma/transaction-runner';
import { LineupsRepository } from '../lineups/lineups.repository';
import { calculateBaseValue } from './domain/base-value';
import { calculateOverall } from './domain/overall';
import { Condition } from './domain/player.types';
import { CreatePlayerInput } from './dto/create-player.schema';
import { UpdatePlayerInput } from './dto/update-player.schema';
import { PlayerView, toPlayerView } from './player.view';
import { PlayersRepository } from './players.repository';

const PLAYER_NOT_FOUND = 'Jogador não encontrado.';

@Injectable()
export class PlayersService {
  constructor(
    private readonly players: PlayersRepository,
    private readonly lineups: LineupsRepository,
    private readonly transactions: TransactionRunner,
  ) {}

  async create(input: CreatePlayerInput): Promise<PlayerView> {
    const overall = calculateOverall(input.position, input);
    const baseValue = calculateBaseValue({
      overall,
      potential: input.potential,
      age: input.age,
    });
    const player = await this.players.create({
      ...input,
      sortName: toSortKey(input.name),
      baseValue: baseValue.toFixed(2),
    });
    return toPlayerView(player);
  }

  async findById(id: number): Promise<PlayerView> {
    const player = await this.players.findActiveById(id);
    if (!player) {
      throw new NotFoundException(PLAYER_NOT_FOUND);
    }
    return toPlayerView(player);
  }

  // RN08: muda só nome, posição, agilidade e idade.
  update(id: number, input: UpdatePlayerInput): Promise<PlayerView> {
    return this.transactions.run(async (db) => {
      const player = await this.lockPlayer(id, db);
      if (input.age < player.age) {
        throw new ConflictException(
          `A idade não pode ser menor que a atual (${player.age}).`,
        );
      }
      if (player.clubId !== null && input.position !== player.position) {
        throw new ConflictException(
          'Jogador com clube não pode mudar de posição.',
        );
      }
      const updated = await this.players.update(
        id,
        { ...input, sortName: toSortKey(input.name) },
        db,
      );
      return toPlayerView(updated);
    });
  }

  // RN19: o jogador que passa a DOENTE sai da escalação na mesma operação.
  changeCondition(id: number, condition: Condition): Promise<PlayerView> {
    return this.transactions.run(async (db) => {
      const player = await this.lockPlayer(id, db);
      if (player.condition === 'DOENTE' && condition === 'APTO') {
        throw new ConflictException(
          'Jogador DOENTE não pode passar direto para APTO.',
        );
      }
      if (player.condition === condition) {
        return toPlayerView(player);
      }
      const updated = await this.players.updateCondition(id, condition, db);
      if (condition === 'DOENTE') {
        await this.lineups.removePlayer(id, db);
      }
      return toPlayerView(updated);
    });
  }

  // RN09: exclusão lógica, só de jogador livre.
  remove(id: number): Promise<void> {
    return this.transactions.run(async (db) => {
      const player = await this.lockPlayer(id, db);
      if (player.clubId !== null) {
        throw new ConflictException('Jogador com clube não pode ser excluído.');
      }
      await this.players.softDelete(id, db);
    });
  }

  private async lockPlayer(id: number, db: DbClient): Promise<Player> {
    const player = await this.players.lockActiveById(id, db);
    if (!player) {
      throw new NotFoundException(PLAYER_NOT_FOUND);
    }
    return player;
  }
}
