import { ConfigService } from '@nestjs/config';
import { Env } from '../../src/config/env';
import { PrismaService } from '../../src/prisma/prisma.service';
import { testDatabaseUrl } from './test-database-url';

export function createTestPrisma(): PrismaService {
  const config = { get: () => testDatabaseUrl() };
  return new PrismaService(config as unknown as ConfigService<Env, true>);
}

export async function clearDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRaw`
    TRUNCATE duelos_partida, partidas, escalacoes, transacoes, contratos, jogadores, clubes
    RESTART IDENTITY CASCADE`;
}
