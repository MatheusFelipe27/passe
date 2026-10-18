import { request } from './http-client';
import type { Condition, Player, Position } from './players';

export type MatchResult = 'MANDANTE' | 'VISITANTE' | 'EMPATE';

export interface MatchSide {
  club_id: number;
  club_name: string;
  formation: Formation;
  goals: number;
}

export interface MatchSummary {
  id: number;
  played_at: string;
  home: MatchSide;
  away: MatchSide;
  result: MatchResult;
}

export type DuelAttribute = 'shooting' | 'passing' | 'dribbling' | 'defending';

// O jogador do duelo com os dados do momento da partida, já com o efeito da condição.
export interface DuelPlayer {
  player_id: number;
  player_name: string;
  position: Position;
  condition: Condition;
  attribute: DuelAttribute;
  value: number;
}

export interface Duel {
  order: number;
  attacking_club_id: number;
  attacker: DuelPlayer;
  defender: DuelPlayer;
  goal: boolean;
}

export interface MatchDetail extends MatchSummary {
  duels: Duel[];
}

export interface MatchOrder {
  home_club_id: number;
  away_club_id: number;
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

// Sem club_id, todas as partidas; com ele, só as do clube, como mandante ou visitante.
export function listMatches(clubId?: number): Promise<MatchSummary[]> {
  return request<MatchSummary[]>('/matches', { query: { club_id: clubId } });
}

// O id vem da URL da tela como texto: um id malformado chega à API, que responde 404.
export function getMatch(id: string): Promise<MatchDetail> {
  return request<MatchDetail>(`/matches/${encodeURIComponent(id)}`);
}

export function playMatch(order: MatchOrder): Promise<MatchDetail> {
  return request<MatchDetail>('/matches', { method: 'POST', body: order });
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
