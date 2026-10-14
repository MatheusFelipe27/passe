import { request } from './http-client';

export type Position = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';
export type Condition = 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE';

export interface Player {
  id: number;
  name: string;
  position: Position;
  agility: number;
  age: number;
  condition: Condition;
  base_value: number;
  market_value: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
  overall: number;
  club_id: number | null;
}

export interface PageMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface PlayerPage {
  data: Player[];
  meta: PageMeta;
}

export interface PlayerFilters {
  free?: boolean;
  page?: number;
  limit?: number;
}

export function listPlayers(filters: PlayerFilters = {}): Promise<PlayerPage> {
  return request<PlayerPage>('/players', { query: { ...filters } });
}
