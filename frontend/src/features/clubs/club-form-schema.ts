import { z } from 'zod';

const REPEATED_SPACES = / {2,}/g;
const LETTER = /\p{L}/u;
const NAME_CHARACTERS = /^[\p{L}\p{Mn} .-]+$/u;
const ACRONYM_FORMAT = /^[A-Z]{3}$/;

// Validação antes de enviar: obrigatórios e limites de um campo só, parando no primeiro erro de
// cada campo. A sigla que precisa aparecer no nome cruza os dois campos e fica com a API.
const nameField = z
  .string()
  .transform((name) => name.trim().replace(REPEATED_SPACES, ' '))
  .pipe(
    z
      .string()
      .min(1, { error: 'Informe o nome.', abort: true })
      .refine(
        (name) => {
          const length = Array.from(name).length;
          return length >= 3 && length <= 60;
        },
        { error: 'Use de 3 a 60 caracteres.', abort: true },
      )
      .refine(
        (name) => {
          const words = name.split(' ').filter((part) => LETTER.test(part));
          return words.length >= 2 && words.length <= 5;
        },
        { error: 'Use de 2 a 5 palavras.', abort: true },
      )
      .refine((name) => NAME_CHARACTERS.test(name), {
        error: 'Use só letras, espaços, hífen e ponto.',
      }),
  );

const acronymField = z
  .string()
  .min(1, { error: 'Informe a sigla.', abort: true })
  .regex(ACRONYM_FORMAT, {
    error: 'Use 3 letras de A a Z, sem acento.',
    abort: true,
  })
  .refine((acronym) => new Set(acronym).size > 1, {
    error: 'As três letras não podem ser iguais.',
  });

export const newClubFormSchema = z.object({
  name: nameField,
  acronym: acronymField,
});

export type NewClubFormValues = z.input<typeof newClubFormSchema>;
