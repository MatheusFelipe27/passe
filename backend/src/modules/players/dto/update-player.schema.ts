import { z } from 'zod';
import {
  agilityForAgeIssue,
  editablePlayerFields,
  isAgilityAllowedForAge,
} from './player-fields.schema';

export const updatePlayerSchema = z
  .object(editablePlayerFields)
  .refine(isAgilityAllowedForAge, agilityForAgeIssue);

export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
