import { Injectable } from '@nestjs/common';
import { DbClient } from '../../prisma/transaction-runner';

@Injectable()
export class LineupsRepository {
  async removePlayer(playerId: number, db: DbClient): Promise<void> {
    await db.lineupEntry.deleteMany({ where: { playerId } });
  }
}
