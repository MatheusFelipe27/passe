import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from './prisma.service';

export type DbClient = Prisma.TransactionClient;

// Operação atômica: tudo o que a função grava entra numa única transação do banco.
@Injectable()
export class TransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(work: (db: DbClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }
}
