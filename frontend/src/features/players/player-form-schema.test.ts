import { describe, expect, it } from 'vitest';
import {
  editPlayerFormSchema,
  newPlayerFormSchema,
  type NewPlayerFormValues,
} from './player-form-schema';

const VALID: NewPlayerFormValues = {
  name: 'Davi Melo',
  position: 'MEI',
  age: '23',
  agility: '70',
  pace: '66',
  shooting: '62',
  passing: '74',
  dribbling: '70',
  defending: '48',
  physical: '58',
  potential: '82',
};

function errorFor(field: keyof NewPlayerFormValues, value: unknown) {
  const result = newPlayerFormSchema.safeParse({ ...VALID, [field]: value });
  if (result.success) {
    return undefined;
  }
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('newPlayerFormSchema', () => {
  it('converte os campos para o corpo da API', () => {
    expect(newPlayerFormSchema.parse(VALID)).toEqual({
      name: 'Davi Melo',
      position: 'MEI',
      age: 23,
      agility: 70,
      pace: 66,
      shooting: 62,
      passing: 74,
      dribbling: 70,
      defending: 48,
      physical: 58,
      potential: 82,
    });
  });

  it('normaliza os espaços do nome', () => {
    const result = newPlayerFormSchema.parse({
      ...VALID,
      name: '  Davi   Melo ',
    });

    expect(result.name).toBe('Davi Melo');
  });

  describe('nome', () => {
    it.each([
      ['', 'Informe o nome.'],
      ['   ', 'Informe o nome.'],
      ['Da', 'Use de 3 a 100 caracteres.'],
      ['A'.repeat(101), 'Use de 3 a 100 caracteres.'],
    ])('recusa %j com "%s"', (name, message) => {
      expect(errorFor('name', name)).toBe(message);
    });

    it.each(['Dav', 'A B', 'A'.repeat(100), `  ${'A'.repeat(100)}  `])(
      'aceita %j',
      (name) => {
        expect(errorFor('name', name)).toBeUndefined();
      },
    );
  });

  it('exige a posição', () => {
    expect(errorFor('position', undefined)).toBe('Escolha a posição.');
  });

  describe('idade', () => {
    it.each([
      ['', 'Informe a idade.'],
      ['15', 'Use uma idade de 16 a 45 anos.'],
      ['46', 'Use uma idade de 16 a 45 anos.'],
      ['20.5', 'Use uma idade de 16 a 45 anos.'],
      ['-1', 'Use uma idade de 16 a 45 anos.'],
      ['abc', 'Use uma idade de 16 a 45 anos.'],
    ])('recusa %j com "%s"', (age, message) => {
      expect(errorFor('age', age)).toBe(message);
    });

    it.each(['16', '17', '44', '45', ' 30 '])('aceita %j', (age) => {
      expect(errorFor('age', age)).toBeUndefined();
    });
  });

  describe('agilidade', () => {
    it.each([
      ['', 'Informe a agilidade.'],
      ['0', 'Use uma agilidade de 1 a 100.'],
      ['101', 'Use uma agilidade de 1 a 100.'],
    ])('recusa %j com "%s"', (agility, message) => {
      expect(errorFor('agility', agility)).toBe(message);
    });

    it.each(['1', '2', '99', '100'])('aceita %j', (agility) => {
      expect(errorFor('agility', agility)).toBeUndefined();
    });
  });

  describe.each([
    ['pace', 'a velocidade'],
    ['shooting', 'a finalização'],
    ['passing', 'o passe'],
    ['dribbling', 'o drible'],
    ['defending', 'a defesa'],
    ['physical', 'o físico'],
    ['potential', 'o potencial'],
  ] as const)('%s', (field, label) => {
    it('é obrigatório', () => {
      expect(errorFor(field, '')).toBe(`Informe ${label}.`);
    });

    it.each(['0', '100', '50.5'])('recusa %j', (value) => {
      expect(errorFor(field, value)).toBe('Use um valor de 1 a 99.');
    });

    it.each(['1', '2', '98', '99'])('aceita %j', (value) => {
      expect(errorFor(field, value)).toBeUndefined();
    });
  });
});

describe('editPlayerFormSchema', () => {
  it('aceita só os quatro campos editáveis', () => {
    expect(
      editPlayerFormSchema.parse({
        name: 'Davi Melo',
        position: 'ATA',
        age: '24',
        agility: '90',
        potential: '1',
      }),
    ).toEqual({ name: 'Davi Melo', position: 'ATA', age: 24, agility: 90 });
  });
});
