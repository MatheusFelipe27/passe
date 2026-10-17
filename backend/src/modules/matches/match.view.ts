import { formatBrasiliaDateTime } from '../../common/time/brasilia-time';
import { Club, MatchDuel } from '../../generated/prisma/client';
import { Formation } from '../lineups/domain/formation';
import { Condition, Position } from '../players/domain/player.types';
import { DuelAttribute, matchResult, MatchResult } from './domain/match';
import { Standing } from './domain/standings';
import type { MatchWithClubs, MatchWithDuels } from './matches.repository';

export interface MatchSideView {
  club_id: number;
  club_name: string;
  formation: Formation;
  goals: number;
}

export interface MatchView {
  id: number;
  played_at: string;
  home: MatchSideView;
  away: MatchSideView;
  result: MatchResult;
}

export interface DuelPlayerView {
  player_id: number;
  player_name: string;
  position: Position;
  condition: Condition;
  attribute: DuelAttribute;
  value: number;
}

export interface DuelView {
  order: number;
  attacking_club_id: number;
  attacker: DuelPlayerView;
  defender: DuelPlayerView;
  goal: boolean;
}

export interface MatchDetailView extends MatchView {
  duels: DuelView[];
}

export interface StandingView {
  position: number;
  club_id: number;
  club_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export function toMatchView(match: MatchWithClubs): MatchView {
  return {
    id: match.id,
    played_at: formatBrasiliaDateTime(match.playedAt),
    home: side(match.homeClub, match.homeFormation, match.homeGoals),
    away: side(match.awayClub, match.awayFormation, match.awayGoals),
    result: matchResult(match.homeGoals, match.awayGoals),
  };
}

// RN20: os duelos como foram gravados, com os nomes, as condições e os valores do momento.
export function toMatchDetailView(match: MatchWithDuels): MatchDetailView {
  return { ...toMatchView(match), duels: match.duels.map(toDuelView) };
}

export function toStandingView(standing: Standing): StandingView {
  return {
    position: standing.position,
    club_id: standing.clubId,
    club_name: standing.clubName,
    played: standing.played,
    wins: standing.wins,
    draws: standing.draws,
    losses: standing.losses,
    goals_for: standing.goalsFor,
    goals_against: standing.goalsAgainst,
    goal_difference: standing.goalDifference,
    points: standing.points,
  };
}

function side(club: Club, formation: string, goals: number): MatchSideView {
  return {
    club_id: club.id,
    club_name: club.name,
    formation: formation as Formation,
    goals,
  };
}

function toDuelView(duel: MatchDuel): DuelView {
  return {
    order: duel.order,
    attacking_club_id: duel.attackingClubId,
    attacker: {
      player_id: duel.attackerId,
      player_name: duel.attackerName,
      position: duel.attackerPosition as Position,
      condition: duel.attackerCondition as Condition,
      attribute: duel.attackAttribute as DuelAttribute,
      value: duel.attackValue,
    },
    defender: {
      player_id: duel.defenderId,
      player_name: duel.defenderName,
      position: duel.defenderPosition as Position,
      condition: duel.defenderCondition as Condition,
      attribute: duel.defenseAttribute as DuelAttribute,
      value: duel.defenseValue,
    },
    goal: duel.goal,
  };
}
