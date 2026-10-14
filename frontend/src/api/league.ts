import { request } from './http-client';

export interface Club {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

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

export function listClubs(): Promise<Club[]> {
  return request<Club[]>('/clubs');
}

export function listMatches(): Promise<MatchSummary[]> {
  return request<MatchSummary[]>('/matches');
}

export function getStandings(): Promise<Standing[]> {
  return request<Standing[]>('/standings');
}
