import { z } from 'zod';
import { countCharacters, countWords } from '../../../common/text/text';
import { normalizedText } from '../../../common/validation/schemas';
import {
  acronymMatchesName,
  hasOnlyClubNameCharacters,
} from '../domain/club-name';

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 60;
const NAME_MIN_WORDS = 2;
const NAME_MAX_WORDS = 5;
const ACRONYM_FORMAT = /^[A-Z]{3}$/;

const clubNameSchema = normalizedText()
  .refine(
    (name) => {
      const length = countCharacters(name);
      return length >= NAME_MIN_LENGTH && length <= NAME_MAX_LENGTH;
    },
    {
      message: `deve ter de ${NAME_MIN_LENGTH} a ${NAME_MAX_LENGTH} caracteres`,
    },
  )
  .refine(
    (name) => {
      const words = countWords(name);
      return words >= NAME_MIN_WORDS && words <= NAME_MAX_WORDS;
    },
    { message: `deve ter de ${NAME_MIN_WORDS} a ${NAME_MAX_WORDS} palavras` },
  )
  .refine(hasOnlyClubNameCharacters, {
    message: 'deve ter só letras, espaços, hífen e ponto',
  });

const acronymSchema = z
  .string()
  .regex(ACRONYM_FORMAT, {
    message: 'deve ter exatamente 3 letras de A a Z, maiúsculas e sem acento',
  })
  .refine((acronym) => new Set(acronym).size > 1, {
    message: 'não pode ter as três letras iguais',
  });

export const createClubSchema = z
  .object({ name: clubNameSchema, acronym: acronymSchema })
  .refine((club) => acronymMatchesName(club.acronym, club.name), {
    path: ['acronym'],
    message:
      'as letras devem aparecer no nome, nessa ordem, começando pela primeira letra do nome',
  });

export type CreateClubInput = z.infer<typeof createClubSchema>;
