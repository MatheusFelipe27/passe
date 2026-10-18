import { request } from './http-client';
import type { Player } from './players';

export interface MatchSide {
  club_id: number;
  club_name: string;
  formation: string;
  goals: number;
}

export interface MatchSummary {
  id: number;
  played_at: string;
  home: MatchSide;
  away: MatchSide;
  result: 'MANDANTE' | 'VISITANTE' | 'EMPATE';
}

export interface Standing {
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

export function listMatches(): Promise<MatchSummary[]> {
  return request<MatchSummary[]>('/matches');
}

export function getStandings(): Promise<Standing[]> {
  return request<Standing[]>('/standings');
}

export type Formation = '3-1' | '2-2' | '2-1-1' | '1-2-1';

export interface Lineup {
  club_id: number;
  formation: Formation | null;
  complete: boolean;
  players: Player[];
}

export interface LineupOrder {
  formation: Formation;
  player_ids: number[];
}

// O id vem da URL da tela como texto, como em getClub.
export function getLineup(clubId: string): Promise<Lineup> {
  return request<Lineup>(`/clubs/${encodeURIComponent(clubId)}/lineup`);
}

export function saveLineup(
  clubId: string,
  order: LineupOrder,
): Promise<Lineup> {
  return request<Lineup>(`/clubs/${encodeURIComponent(clubId)}/lineup`, {
    method: 'PUT',
    body: order,
  });
}
