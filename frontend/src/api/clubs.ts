import { request } from './http-client';
import type { Player } from './players';

export interface Club {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

export type ClubSort = 'name' | 'net_worth_desc' | 'net_worth_asc';

export interface ClubContract {
  purchase_value: number;
  loyalty_until: string;
  remaining_days: number;
  penalty_rate: number;
}

export interface RosterPlayer extends Player {
  contract: ClubContract | null;
}

export interface ClubDetail extends Club {
  players: RosterPlayer[];
}

export interface NewClub {
  name: string;
  acronym: string;
}

// A API ordena pelo nome quando o sort não é enviado.
export function listClubs(sort: ClubSort = 'name'): Promise<Club[]> {
  return request<Club[]>('/clubs', {
    query: { sort: sort === 'name' ? undefined : sort },
  });
}

// O id vem da URL da tela como texto: um id malformado chega à API, que responde 404.
export function getClub(id: string): Promise<ClubDetail> {
  return request<ClubDetail>(`/clubs/${encodeURIComponent(id)}`);
}

export function createClub(club: NewClub): Promise<Club> {
  return request<Club>('/clubs', { method: 'POST', body: club });
}
