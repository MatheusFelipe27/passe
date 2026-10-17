import { z } from 'zod';
import { idParam } from '../../../common/validation/query-params';

// RN21: club_id opcional filtra as partidas em que o clube foi mandante ou visitante.
export const listMatchesQuerySchema = z
  .object({ club_id: idParam().optional() })
  .transform((query) => ({ clubId: query.club_id }));

export type ListMatchesQuery = z.output<typeof listMatchesQuerySchema>;
