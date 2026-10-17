import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Clock } from '../../common/time/clock';
import { Club, Player, Prisma } from '../../generated/prisma/client';
import { DbClient, TransactionRunner } from '../../prisma/transaction-runner';
import { ClubsRepository } from '../clubs/clubs.repository';
import {
  Formation,
  isLineupComplete,
  LINEUP_SIZE,
} from '../lineups/domain/formation';
import { LineupsRepository } from '../lineups/lineups.repository';
import { Condition, Position } from '../players/domain/player.types';
import { MatchTeam, playMatch } from './domain/match';
import { calculateStandings } from './domain/standings';
import { ListMatchesQuery } from './dto/list-matches.query';
import { PlayMatchInput } from './dto/play-match.schema';
import {
  MatchDetailView,
  MatchView,
  StandingView,
  toMatchDetailView,
  toMatchView,
  toStandingView,
} from './match.view';
import { MatchesRepository } from './matches.repository';

// Todas as leituras da operação veem o banco no mesmo instante.
const SNAPSHOT = {
  isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
};

interface ReadyClub {
  formation: Formation;
  team: MatchTeam;
}

@Injectable()
export class MatchesService {
  constructor(
    private readonly matches: MatchesRepository,
    private readonly clubs: ClubsRepository,
    private readonly lineups: LineupsRepository,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  // RN20: confere os dois clubes, joga os 6 duelos e grava tudo numa única operação.
  play(input: PlayMatchInput): Promise<MatchDetailView> {
    const playedAt = this.clock.now();
    return this.transactions.run(async (db) => {
      const home = await this.findClub(input.homeClubId, db);
      const away = await this.findClub(input.awayClubId, db);
      const homeReady = await this.ready(home, db);
      const awayReady = await this.ready(away, db);
      const match = await this.matches.create(
        {
          homeClubId: home.id,
          awayClubId: away.id,
          homeFormation: homeReady.formation,
          awayFormation: awayReady.formation,
          outcome: playMatch(homeReady.team, awayReady.team),
          playedAt,
        },
        db,
      );
      return toMatchDetailView(match);
    }, SNAPSHOT);
  }

  async list(query: ListMatchesQuery): Promise<MatchView[]> {
    if (
      query.clubId !== undefined &&
      !(await this.clubs.exists(query.clubId))
    ) {
      throw new NotFoundException('Clube não encontrado.');
    }
    return (await this.matches.findAll(query.clubId)).map(toMatchView);
  }

  async findById(id: number): Promise<MatchDetailView> {
    const match = await this.matches.findById(id);
    if (!match) {
      throw new NotFoundException('Partida não encontrada.');
    }
    return toMatchDetailView(match);
  }

  // RN21: calculada a cada consulta, com os clubes e as partidas lidos no mesmo instante.
  standings(): Promise<StandingView[]> {
    return this.transactions.run(async (db) => {
      const clubs = await this.clubs.findAll(db);
      const scores = await this.matches.findScores(db);
      return calculateStandings(clubs, scores).map(toStandingView);
    }, SNAPSHOT);
  }

  private async findClub(id: number, db: DbClient): Promise<Club> {
    const club = await this.clubs.findById(id, db);
    if (!club) {
      throw new NotFoundException('Clube não encontrado.');
    }
    return club;
  }

  // RN20, passo 1: só joga quem tem a escalação completa, com os 5 titulares.
  private async ready(club: Club, db: DbClient): Promise<ReadyClub> {
    const starters = await this.lineups.findStarters(club.id, db);
    if (!isLineupComplete(club.formation, starters.length)) {
      throw new ConflictException(
        `O ${club.name} não tem a escalação completa, com os ${LINEUP_SIZE} titulares.`,
      );
    }
    return {
      formation: club.formation as Formation,
      team: { clubId: club.id, players: starters.map(toMatchPlayer) },
    };
  }
}

function toMatchPlayer(player: Player) {
  return {
    id: player.id,
    name: player.name,
    position: player.position as Position,
    condition: player.condition as Condition,
    shooting: player.shooting,
    passing: player.passing,
    dribbling: player.dribbling,
    defending: player.defending,
  };
}
