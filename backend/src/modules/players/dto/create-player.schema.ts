import { z } from 'zod';
import {
  countCharacters,
  countWords,
  hasDigit,
} from '../../../common/text/text';
import {
  integerBetween,
  normalizedText,
} from '../../../common/validation/schemas';
import {
  ATTRIBUTES,
  PlayerAttributes,
  POSITIONS,
} from '../domain/player.types';

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 100;
const NAME_MIN_WORDS = 2;

const AGILITY_MAX_FOR_VETERANS = 85;
const VETERAN_AGILITY_MIN_AGE = 35;
const ATTRIBUTES_MAX_SUM = 480;
const FIXED_POTENTIAL_MIN_AGE = 33;

const playerNameSchema = normalizedText()
  .refine(
    (name) => {
      const length = countCharacters(name);
      return length >= NAME_MIN_LENGTH && length <= NAME_MAX_LENGTH;
    },
    {
      message: `deve ter de ${NAME_MIN_LENGTH} a ${NAME_MAX_LENGTH} caracteres`,
    },
  )
  .refine((name) => countWords(name) >= NAME_MIN_WORDS, {
    message: `deve ter pelo menos ${NAME_MIN_WORDS} palavras`,
  })
  .refine((name) => !hasDigit(name), { message: 'não pode ter dígitos' });

const playerPositionSchema = z.enum(POSITIONS);
const playerAgilitySchema = integerBetween(1, 100);
const playerAgeSchema = integerBetween(16, 45);

const attributeSchema = integerBetween(1, 99);

function isAgilityAllowedForAge(agility: number, age: number): boolean {
  return age < VETERAN_AGILITY_MIN_AGE || agility <= AGILITY_MAX_FOR_VETERANS;
}

const AGILITY_FOR_AGE_MESSAGE = `com ${VETERAN_AGILITY_MIN_AGE} anos ou mais, a agilidade é de no máximo ${AGILITY_MAX_FOR_VETERANS}`;

export const createPlayerSchema = z
  .object({
    name: playerNameSchema,
    position: playerPositionSchema,
    agility: playerAgilitySchema,
    age: playerAgeSchema,
    pace: attributeSchema,
    shooting: attributeSchema,
    passing: attributeSchema,
    dribbling: attributeSchema,
    defending: attributeSchema,
    physical: attributeSchema,
    potential: attributeSchema,
  })
  .refine((player) => isAgilityAllowedForAge(player.agility, player.age), {
    path: ['agility'],
    message: AGILITY_FOR_AGE_MESSAGE,
  })
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
