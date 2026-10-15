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

  async exists(id: number): Promise<boolean> {
    return (await this.prisma.club.count({ where: { id } })) > 0;
  }

  // Duas criações ao mesmo tempo esperam uma pela outra até o fim da transação.
  async lockCreation(db: DbClient): Promise<void> {
    await db.$executeRaw`SELECT pg_advisory_xact_lock(${CLUB_CREATION_LOCK})`;
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
