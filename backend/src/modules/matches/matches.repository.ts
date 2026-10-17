import { Injectable } from '@nestjs/common';
import { Club, Match, MatchDuel } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DbClient } from '../../prisma/transaction-runner';
import { Formation } from '../lineups/domain/formation';
import { Duel, MatchOutcome } from './domain/match';
import { MatchScore } from './domain/standings';

export interface NewMatch {
  homeClubId: number;
  awayClubId: number;
  homeFormation: Formation;
  awayFormation: Formation;
  outcome: MatchOutcome;
  playedAt: Date;
}

export type MatchWithClubs = Match & { homeClub: Club; awayClub: Club };

export type MatchWithDuels = MatchWithClubs & { duels: MatchDuel[] };

const WITH_CLUBS = { homeClub: true, awayClub: true } as const;

const WITH_DUELS = {
  ...WITH_CLUBS,
  duels: { orderBy: { order: 'asc' } },
} as const;

@Injectable()
export class MatchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // RN20: grava a partida e os 6 duelos com os dados do momento; nada é recalculado depois.
  create(match: NewMatch, db: DbClient): Promise<MatchWithDuels> {
    return db.match.create({
      data: {
        homeClubId: match.homeClubId,
        awayClubId: match.awayClubId,
        homeGoals: match.outcome.homeGoals,
        awayGoals: match.outcome.awayGoals,
        homeFormation: match.homeFormation,
        awayFormation: match.awayFormation,
        playedAt: match.playedAt,
        duels: { create: match.outcome.duels.map(toDuelRow) },
      },
      include: WITH_DUELS,
    });
  }

  findById(id: number): Promise<MatchWithDuels | null> {
    return this.prisma.match.findUnique({ where: { id }, include: WITH_DUELS });
  }

  // RN21: da mais recente para a mais antiga; no mesmo instante, o maior id primeiro.
  findAll(clubId?: number): Promise<MatchWithClubs[]> {
    return this.prisma.match.findMany({
      where:
        clubId === undefined
          ? undefined
          : { OR: [{ homeClubId: clubId }, { awayClubId: clubId }] },
      include: WITH_CLUBS,
      orderBy: [{ playedAt: 'desc' }, { id: 'desc' }],
    });
  }

  findScores(db: DbClient): Promise<MatchScore[]> {
    return db.match.findMany({
      select: {
        homeClubId: true,
        awayClubId: true,
        homeGoals: true,
        awayGoals: true,
      },
    });
  }
}

function toDuelRow(duel: Duel) {
  return {
    order: duel.order,
    attackingClubId: duel.attackingClubId,
    attackerId: duel.attacker.player.id,
    defenderId: duel.defender.player.id,
    attackerName: duel.attacker.player.name,
    defenderName: duel.defender.player.name,
    attackerPosition: duel.attacker.player.position,
    defenderPosition: duel.defender.player.position,
    attackerCondition: duel.attacker.player.condition,
    defenderCondition: duel.defender.player.condition,
    attackAttribute: duel.attacker.attribute,
    defenseAttribute: duel.defender.attribute,
    attackValue: duel.attacker.value,
    defenseValue: duel.defender.value,
    goal: duel.goal,
  };
}
