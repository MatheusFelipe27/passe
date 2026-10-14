import { Injectable } from '@nestjs/common';
import { Player } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DbClient } from '../../prisma/transaction-runner';
import { Condition, PlayerAttributes, Position } from './domain/player.types';
import { ListPlayersQuery } from './dto/list-players.query';
import { buildPlayersFilter, buildPlayersOrder } from './players.query-builder';

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

export interface PlayerPage {
  players: Player[];
  total: number;
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

  // RN07: busca, filtra e ordena no banco e só depois pagina.
  async list(query: ListPlayersQuery): Promise<PlayerPage> {
    const filter = buildPlayersFilter(query);
    const offset = (query.page - 1) * query.limit;
    const [rows, [{ total }]] = await Promise.all([
      this.prisma.$queryRaw<{ id: number }[]>`
        SELECT j.id FROM jogadores j WHERE ${filter}
        ORDER BY ${buildPlayersOrder(query.sort)}
        LIMIT ${query.limit} OFFSET ${offset}`,
      this.prisma.$queryRaw<{ total: number }[]>`
        SELECT COUNT(*)::int AS total FROM jogadores j WHERE ${filter}`,
    ]);
    const ids = rows.map((row) => row.id);
    const players = await this.prisma.player.findMany({
      where: { id: { in: ids } },
    });
    const byId = new Map(players.map((player) => [player.id, player]));
    return {
      players: ids.flatMap((id) => byId.get(id) ?? []),
      total,
    };
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
