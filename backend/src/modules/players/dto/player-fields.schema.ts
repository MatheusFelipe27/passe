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
import { POSITIONS } from '../domain/player.types';

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 100;
const NAME_MIN_WORDS = 2;

const AGILITY_MAX_FOR_VETERANS = 85;
const VETERAN_AGILITY_MIN_AGE = 35;

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

// Campos aceitos tanto no cadastro quanto na edição (RN08).
export const editablePlayerFields = {
  name: playerNameSchema,
  position: z.enum(POSITIONS),
  agility: integerBetween(1, 100),
  age: integerBetween(16, 45),
};

export function isAgilityAllowedForAge(player: {
  agility: number;
  age: number;
}): boolean {
  return (
    player.age < VETERAN_AGILITY_MIN_AGE ||
    player.agility <= AGILITY_MAX_FOR_VETERANS
  );
}

export const agilityForAgeIssue = {
  path: ['agility'],
  message: `com ${VETERAN_AGILITY_MIN_AGE} anos ou mais, a agilidade é de no máximo ${AGILITY_MAX_FOR_VETERANS}`,
};
