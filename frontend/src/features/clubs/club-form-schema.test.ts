import { describe, expect, it } from 'vitest';
import { newClubFormSchema } from './club-form-schema';

const VALID = { name: 'Leões da Serra', acronym: 'LDS' };

function errorsOf(values: Partial<typeof VALID>) {
  const result = newClubFormSchema.safeParse({ ...VALID, ...values });
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
}

describe('newClubFormSchema', () => {
  it('aceita o clube do mockup', () => {
    expect(errorsOf({})).toEqual({});
  });

  describe('nome', () => {
    it.each([
      ['vazio', ''],
      ['só espaços', '   '],
    ])('pede o nome quando ele está %s', (_, name) => {
      expect(errorsOf({ name }).name).toBe('Informe o nome.');
    });

    it.each([
      ['2 caracteres', 'Ab', 'Use de 3 a 60 caracteres.'],
      ['3 caracteres', 'A B', undefined],
      ['60 caracteres', `A ${'b'.repeat(58)}`, undefined],
      ['61 caracteres', `A ${'b'.repeat(59)}`, 'Use de 3 a 60 caracteres.'],
    ])('%s', (_, name, message) => {
      expect(errorsOf({ name }).name).toBe(message);
    });

    it('conta os caracteres depois de tirar os espaços das pontas e os repetidos', () => {
      expect(errorsOf({ name: `  A   ${'b'.repeat(58)}  ` }).name).toBe(
        undefined,
      );
    });

    it('conta letras acentuadas como um caractere só', () => {
      expect(errorsOf({ name: `É ${'é'.repeat(58)}` }).name).toBe(undefined);
    });

    it.each([
      ['1 palavra', 'Leões', 'Use de 2 a 5 palavras.'],
      ['2 palavras', 'Leões Serra', undefined],
      ['5 palavras', 'Clube dos Leões da Serra', undefined],
      ['6 palavras', 'Clube dos Leões da Serra Alta', 'Use de 2 a 5 palavras.'],
    ])('%s', (_, name, message) => {
      expect(errorsOf({ name }).name).toBe(message);
    });

    it('não conta como palavra um trecho sem letra', () => {
      expect(errorsOf({ name: 'Leões -' }).name).toBe('Use de 2 a 5 palavras.');
    });

    it.each([
      ['hífen', 'Leões-da Serra'],
      ['ponto', 'S.C. Serra'],
      ['acentos', 'Águias Gaúchas'],
    ])('aceita %s', (_, name) => {
      expect(errorsOf({ name }).name).toBe(undefined);
    });

    it.each([
      ['dígito', 'Leões da Serra 2'],
      ['sublinhado', 'Leões_da Serra'],
      ['apóstrofo', "Leões d'Serra"],
      ['barra', 'Leões/Serra FC'],
    ])('recusa %s', (_, name) => {
      expect(errorsOf({ name }).name).toBe(
        'Use só letras, espaços, hífen e ponto.',
      );
    });
  });

  describe('sigla', () => {
    it('pede a sigla quando ela está vazia', () => {
      expect(errorsOf({ acronym: '' }).acronym).toBe('Informe a sigla.');
    });

    it.each([
      ['2 letras', 'LD'],
      ['4 letras', 'LDSE'],
      ['minúsculas', 'lds'],
      ['acento', 'LÉS'],
      ['dígito', 'LD1'],
      ['espaço', 'L S'],
    ])('recusa %s', (_, acronym) => {
      expect(errorsOf({ acronym }).acronym).toBe(
        'Use 3 letras de A a Z, sem acento.',
      );
    });

    it.each([
      ['as três iguais', 'AAA', 'As três letras não podem ser iguais.'],
      ['duas iguais', 'AAB', undefined],
      ['todas diferentes', 'ABC', undefined],
    ])('%s', (_, acronym, message) => {
      expect(errorsOf({ name: 'Arara Azul Bela Cor', acronym }).acronym).toBe(
        message,
      );
    });

    it('deixa para a API conferir se as letras aparecem no nome', () => {
      expect(errorsOf({ name: 'Tubarões EC', acronym: 'UBA' })).toEqual({});
    });
  });
});
