import { z } from 'zod';
import { MAX_ID } from '../../../common/pipes/parse-resource-id.pipe';
import { integerBetween } from '../../../common/validation/schemas';

// RN20: dois clubes diferentes; mandante igual ao visitante → 400.
export const playMatchSchema = z
  .object({
    home_club_id: integerBetween(1, MAX_ID),
    away_club_id: integerBetween(1, MAX_ID),
  })
  .refine((body) => body.home_club_id !== body.away_club_id, {
    error: 'deve ser diferente de home_club_id',
    path: ['away_club_id'],
  })
  .transform((body) => ({
    homeClubId: body.home_club_id,
    awayClubId: body.away_club_id,
  }));

export type PlayMatchInput = z.output<typeof playMatchSchema>;
