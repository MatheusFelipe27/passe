import { Injectable } from '@nestjs/common';
import { Player, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DbClient } from '../../prisma/transaction-runner';
import { Formation } from './domain/formation';

@Injectable()
export class LineupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Trava os jogadores em ordem crescente de id, para que duas escalações não se travem uma à outra.
  async lockActivePlayers(ids: number[], db: DbClient): Promise<Player[]> {
    const locked = await db.$queryRaw<{ id: number }[]>`
      SELECT id FROM jogadores
      WHERE id IN (${Prisma.join(ids)}) AND excluido_em IS NULL
      ORDER BY id FOR UPDATE`;
    return db.player.findMany({
      where: { id: { in: locked.map((row) => row.id) } },
    });
  }

  // RN19: a nova escalação substitui a anterior por inteiro.
  async replace(
    clubId: number,
    formation: Formation,
    playerIds: number[],
    db: DbClient,
  ): Promise<void> {
    await db.lineupEntry.deleteMany({ where: { clubId } });
    await db.lineupEntry.createMany({
      data: playerIds.map((playerId) => ({ clubId, playerId })),
    });
    await db.club.update({ where: { id: clubId }, data: { formation } });
  }

  findStarters(clubId: number, db: DbClient = this.prisma): Promise<Player[]> {
    return db.player.findMany({
      where: { lineupEntry: { clubId }, deletedAt: null },
    });
  }

  async removePlayer(playerId: number, db: DbClient): Promise<void> {
    await db.lineupEntry.deleteMany({ where: { playerId } });
  }
}
