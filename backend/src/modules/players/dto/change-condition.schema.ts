import { z } from 'zod';
import { CONDITIONS } from '../domain/player.types';

export const changeConditionSchema = z.object({
  condition: z.enum(CONDITIONS),
});

export type ChangeConditionInput = z.infer<typeof changeConditionSchema>;
