import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Clock } from '../../common/time/clock';
import { TransactionRunner } from '../../prisma/transaction-runner';
import {
  ClubDetailView,
  ClubView,
  toClubDetailView,
  toClubView,
} from './club.view';
import { ClubsRepository } from './clubs.repository';
import { toClubNameKey } from './domain/club-name';
import { sortClubs } from './domain/club-order';
import { CreateClubInput } from './dto/create-club.schema';
import { ListClubsQuery } from './dto/list-clubs.query';

// RN10: a liga aceita no máximo 20 clubes.
const MAX_CLUBS = 20;

@Injectable()
export class ClubsService {
  constructor(
    private readonly clubs: ClubsRepository,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  // RN10: o clube nasce com 300,00 em caixa (padrão do banco) e sem jogadores.
  create(input: CreateClubInput): Promise<ClubView> {
    return this.transactions.run(async (db) => {
      await this.clubs.lockCreation(db);
      if ((await this.clubs.count(db)) >= MAX_CLUBS) {
        throw new ConflictException(
          `A liga já tem ${MAX_CLUBS} clubes, o máximo permitido.`,
        );
      }
      // Recusa de um campo só: a mensagem começa pelo campo, como nas recusas de validação.
      const normalizedName = toClubNameKey(input.name);
      if (await this.clubs.existsByNormalizedName(normalizedName, db)) {
        throw new ConflictException(
          `name: já existe um clube com o nome ${input.name}`,
        );
      }
      if (await this.clubs.existsByAcronym(input.acronym, db)) {
        throw new ConflictException(
          `acronym: já existe um clube com a sigla ${input.acronym}`,
        );
      }
      const club = await this.clubs.create(
        { name: input.name, normalizedName, acronym: input.acronym },
        db,
      );
      return toClubView(club, []);
    });
  }

  async list(query: ListClubsQuery): Promise<ClubView[]> {
    const clubs = await this.clubs.findAllWithPlayers();
    const views = clubs.map((club) => toClubView(club, club.players));
    return sortClubs(views, query.sort);
  }

  async findById(id: number): Promise<ClubDetailView> {
    const club = await this.clubs.findWithRoster(id);
    if (!club) {
      throw new NotFoundException('Clube não encontrado.');
    }
    return toClubDetailView(club, club.players, this.clock.now());
  }
}
