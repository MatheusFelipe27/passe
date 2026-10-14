import { z } from 'zod';
import { integerBetween } from '../../../common/validation/schemas';
import { ATTRIBUTES, PlayerAttributes } from '../domain/player.types';
import {
  agilityForAgeIssue,
  editablePlayerFields,
  isAgilityAllowedForAge,
} from './player-fields.schema';

const ATTRIBUTES_MAX_SUM = 480;
const FIXED_POTENTIAL_MIN_AGE = 33;

const attributeSchema = integerBetween(1, 99);

export const createPlayerSchema = z
  .object({
    ...editablePlayerFields,
    pace: attributeSchema,
    shooting: attributeSchema,
    passing: attributeSchema,
    dribbling: attributeSchema,
    defending: attributeSchema,
    physical: attributeSchema,
    potential: attributeSchema,
  })
  .refine(isAgilityAllowedForAge, agilityForAgeIssue)
  .refine((player) => sumAttributes(player) <= ATTRIBUTES_MAX_SUM, {
    path: ['attributes'],
    message: `a soma dos seis atributos não pode passar de ${ATTRIBUTES_MAX_SUM}`,
  })
  .refine((player) => player.potential >= highestAttribute(player), {
    path: ['potential'],
    message: 'não pode ser menor que o maior dos seis atributos',
  })
  .refine(
    (player) =>
      player.age < FIXED_POTENTIAL_MIN_AGE ||
      player.potential === highestAttribute(player),
    {
      path: ['potential'],
      message: `com ${FIXED_POTENTIAL_MIN_AGE} anos ou mais, deve ser igual ao maior dos seis atributos`,
    },
  );

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;

function sumAttributes(player: PlayerAttributes): number {
  return ATTRIBUTES.reduce((sum, attribute) => sum + player[attribute], 0);
}

function highestAttribute(player: PlayerAttributes): number {
  return Math.max(...ATTRIBUTES.map((attribute) => player[attribute]));
}
