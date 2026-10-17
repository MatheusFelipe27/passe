import { Injectable } from '@nestjs/common';
import { Club, Contract, Player } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DbClient } from '../../prisma/transaction-runner';

// Chave do lock que serializa as criações de clube (limite de 20 e unicidades).
const CLUB_CREATION_LOCK = 1;

export interface NewClub {
  name: string;
  normalizedName: string;
  acronym: string;
}

export type ClubWithPlayers = Club & { players: Player[] };

export type RosterPlayer = Player & { contracts: Contract[] };

export type ClubWithRoster = Club & { players: RosterPlayer[] };

@Injectable()
export class ClubsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number, db: DbClient = this.prisma): Promise<Club | null> {
    return db.club.findUnique({ where: { id } });
  }

  findAll(db: DbClient): Promise<Club[]> {
    return db.club.findMany();
  }

  async exists(id: number): Promise<boolean> {
    return (await this.prisma.club.count({ where: { id } })) > 0;
  }

  // Duas criações ao mesmo tempo esperam uma pela outra até o fim da transação.
  async lockCreation(db: DbClient): Promise<void> {
    await db.$executeRaw`SELECT pg_advisory_xact_lock(${CLUB_CREATION_LOCK})`;
  }

  // Trava o clube até o fim da transação: o caixa e o elenco não mudam no meio da operação.
  async lock(id: number, db: DbClient): Promise<Club | null> {
    const locked = await db.$queryRaw<{ id: number }[]>`
      SELECT id FROM clubes WHERE id = ${id} FOR UPDATE`;
    return locked.length > 0 ? db.club.findUnique({ where: { id } }) : null;
  }

  count(db: DbClient): Promise<number> {
    return db.club.count();
  }

  async existsByNormalizedName(
    normalizedName: string,
    db: DbClient,
  ): Promise<boolean> {
    return (await db.club.count({ where: { normalizedName } })) > 0;
  }

  async existsByAcronym(acronym: string, db: DbClient): Promise<boolean> {
    return (await db.club.count({ where: { acronym } })) > 0;
  }

  create(club: NewClub, db: DbClient): Promise<Club> {
    return db.club.create({ data: club });
  }

  findAllWithPlayers(): Promise<ClubWithPlayers[]> {
    return this.prisma.club.findMany({
      include: { players: { where: { deletedAt: null } } },
    });
  }

  findWithRoster(id: number): Promise<ClubWithRoster | null> {
    return this.prisma.club.findUnique({
      where: { id },
      include: {
        players: {
          where: { deletedAt: null },
          include: { contracts: { where: { clubId: id, status: 'ATIVO' } } },
        },
      },
    });
  }
}
