import { z } from 'zod';

export const CLUB_SORT_KEYS = [
  'name',
  'net_worth_asc',
  'net_worth_desc',
] as const;
export type ClubSortKey = (typeof CLUB_SORT_KEYS)[number];

// RN11: um só valor de sort; o padrão é a ordem alfabética.
export const listClubsQuerySchema = z
  .object({ sort: z.enum(CLUB_SORT_KEYS).optional() })
  .transform((query) => ({ sort: query.sort ?? 'name' }));

export type ListClubsQuery = z.infer<typeof listClubsQuerySchema>;
