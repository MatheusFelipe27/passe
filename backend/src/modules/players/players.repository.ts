import { Injectable } from '@nestjs/common';
import { Player } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DbClient } from '../../prisma/transaction-runner';
import { Condition, PlayerAttributes, Position } from './domain/player.types';

export interface PlayerChanges {
  name: string;
  sortName: string;
  position: Position;
  agility: number;
  age: number;
}

export interface NewPlayer extends PlayerChanges, PlayerAttributes {
  potential: number;
  baseValue: string;
}

@Injectable()
export class PlayersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(player: NewPlayer): Promise<Player> {
    return this.prisma.player.create({ data: player });
  }

  findActiveById(id: number): Promise<Player | null> {
    return this.prisma.player.findFirst({ where: { id, deletedAt: null } });
  }

  // Trava a linha do jogador até o fim da transação, para que duas operações não o alterem ao mesmo tempo.
  async lockActiveById(id: number, db: DbClient): Promise<Player | null> {
    const locked = await db.$queryRaw<{ id: number }[]>`
      SELECT id FROM jogadores WHERE id = ${id} AND excluido_em IS NULL FOR UPDATE`;
    return locked.length > 0 ? db.player.findUnique({ where: { id } }) : null;
  }

  update(id: number, changes: PlayerChanges, db: DbClient): Promise<Player> {
    return db.player.update({ where: { id }, data: changes });
  }

  updateCondition(
    id: number,
    condition: Condition,
    db: DbClient,
  ): Promise<Player> {
    return db.player.update({ where: { id }, data: { condition } });
  }

  async softDelete(id: number, db: DbClient): Promise<void> {
    await db.player.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
