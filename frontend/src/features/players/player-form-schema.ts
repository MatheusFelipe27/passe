import { z } from 'zod';
import type { Position } from '@/api/players';
import { POSITIONS } from './player-labels';

const INTEGER = /^\d+$/;
const REPEATED_SPACES = / {2,}/g;

// Os formulários validam antes de enviar os obrigatórios e os limites de um campo só;
// as regras que cruzam campos (soma dos atributos, potencial, agilidade aos 35+) ficam com a API.
function integerField(
  min: number,
  max: number,
  rangeMessage: string,
  requiredMessage: string,
) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .regex(INTEGER, rangeMessage)
    .transform(Number)
    .pipe(z.number().min(min, rangeMessage).max(max, rangeMessage));
}

const nameField = z
  .string()
  .transform((name) => name.trim().replace(REPEATED_SPACES, ' '))
  .pipe(
    z
      .string()
      .min(1, 'Informe o nome.')
      .refine((name) => {
        const length = Array.from(name).length;
        return length >= 3 && length <= 100;
      }, 'Use de 3 a 100 caracteres.'),
  );

const positionField = z.enum(POSITIONS as [Position, ...Position[]], {
  error: 'Escolha a posição.',
});

const ageField = integerField(
  16,
  45,
  'Use uma idade de 16 a 45 anos.',
  'Informe a idade.',
);

const agilityField = integerField(
  1,
  100,
  'Use uma agilidade de 1 a 100.',
  'Informe a agilidade.',
);

function attributeField(label: string) {
  return integerField(1, 99, 'Use um valor de 1 a 99.', `Informe ${label}.`);
}

export const editPlayerFormSchema = z.object({
  name: nameField,
  position: positionField,
  age: ageField,
  agility: agilityField,
});

export const newPlayerFormSchema = editPlayerFormSchema.extend({
  pace: attributeField('a velocidade'),
  shooting: attributeField('a finalização'),
  passing: attributeField('o passe'),
  dribbling: attributeField('o drible'),
  defending: attributeField('a defesa'),
  physical: attributeField('o físico'),
  potential: attributeField('o potencial'),
});

export type EditPlayerFormValues = z.input<typeof editPlayerFormSchema>;
export type NewPlayerFormValues = z.input<typeof newPlayerFormSchema>;
