import { z } from 'zod';
import { MAX_ID } from '../../../common/pipes/parse-resource-id.pipe';
import { integerBetween } from '../../../common/validation/schemas';
import { FORMATION_NAMES, LINEUP_SIZE } from '../domain/formation';

// RN19: exatamente 5 ids, distintos e inteiros positivos, em qualquer ordem.
const playerIdsSchema = z
  .array(integerBetween(1, MAX_ID))
  .length(LINEUP_SIZE, { error: `deve ter exatamente ${LINEUP_SIZE} ids` })
  .refine((ids) => new Set(ids).size === ids.length, {
    error: 'não pode ter ids repetidos',
  });

export const saveLineupSchema = z
  .object({
    formation: z.enum(FORMATION_NAMES),
    player_ids: playerIdsSchema,
  })
  .transform((body) => ({
    formation: body.formation,
    playerIds: body.player_ids,
  }));

export type SaveLineupInput = z.output<typeof saveLineupSchema>;
