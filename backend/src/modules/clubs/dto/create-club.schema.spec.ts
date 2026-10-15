import { createClubSchema } from './create-club.schema';

const VALID = { name: 'Águias FC', acronym: 'AGU' };

function isAccepted(body: unknown): boolean {
  return createClubSchema.safeParse(body).success;
}

// Confere só o erro do nome, independente da sigla.
function hasNameIssue(name: unknown): boolean {
  const result = createClubSchema.safeParse({ name, acronym: 'XYZ' });
  return (
    !result.success &&
    result.error.issues.some((issue) => issue.path[0] === 'name')
  );
}

function withFields(fields: Record<string, unknown>) {
  return { ...VALID, ...fields };
}

describe('createClubSchema', () => {
  it('aceita o clube válido e normaliza os espaços do nome', () => {
    expect(
      createClubSchema.parse(withFields({ name: '  Águias   FC ' })),
    ).toEqual(VALID);
  });

  it('ignora o caixa e os outros campos enviados (V3 e V7)', () => {
    expect(
      createClubSchema.parse(withFields({ cash: 1000, id: 9, squad_value: 1 })),
    ).toEqual(VALID);
  });

  it.each([[[]], ['x'], [10], [null], [undefined]])(
    'recusa o corpo %j',
    (body) => {
      expect(isAccepted(body)).toBe(false);
    },
  );

  it.each(['name', 'acronym'])('exige %s, ausente ou nulo', (field) => {
    const rest = Object.fromEntries(
      Object.entries(VALID).filter(([key]) => key !== field),
    );
    expect(isAccepted(rest)).toBe(false);
    expect(isAccepted(withFields({ [field]: null }))).toBe(false);
  });

  describe('nome', () => {
    it.each([
      ['3 caracteres, mínimo', 'A B', true],
      ['60 caracteres', `A ${'b'.repeat(58)}`, true],
      ['61 caracteres', `A ${'b'.repeat(59)}`, false],
      ['vazio depois de normalizar', '   ', false],
    ])('tamanho: %s', (_description, name, expected) => {
      expect(hasNameIssue(name)).toBe(!expected);
    });

    it('recusa 2 caracteres', () => {
      expect(hasNameIssue('AB')).toBe(true);
    });

    it.each([
      ['Águias', 'AGU', false],
      ['Águias FC', 'AGU', true],
      ['Águias Futebol Clube da Serra', 'AGU', true],
      ['Águias Futebol Clube da Serra Norte', 'AGU', false],
      ['Águias - FC', 'AGU', true],
    ])('palavras: %j aceito = %s', (name, acronym, expected) => {
      expect(isAccepted({ name, acronym })).toBe(expected);
    });

    it.each([
      ['Águias F.C.', true],
      ['São-Paulo Esporte', true],
      ['Águias FC 2', false],
      ['Águias_FC Norte', false],
      ['Águias & FC', false],
      ['Águias FC!', false],
      ['Águias\tFC', false],
    ])('caracteres: %j aceito = %s', (name, expected) => {
      const acronym = name.startsWith('S') ? 'SPE' : 'AGU';
      expect(isAccepted({ name, acronym })).toBe(expected);
    });

    it.each([[10], [true], [['Águias FC']]])('recusa o tipo de %j', (name) => {
      expect(isAccepted(withFields({ name }))).toBe(false);
    });
  });

  describe('sigla', () => {
    it.each([
      ['agu', false],
      ['Agu', false],
      ['AG', false],
      ['AGUI', false],
      ['ÁGU', false],
      ['A1U', false],
      [' AGU', false],
      [10, false],
    ])('formato %j aceito = %s', (acronym, expected) => {
      expect(isAccepted(withFields({ acronym }))).toBe(expected);
    });

    it('recusa as três letras iguais', () => {
      expect(isAccepted({ name: 'Aaa Atlético', acronym: 'AAA' })).toBe(false);
    });

    it('aceita duas letras iguais', () => {
      expect(isAccepted({ name: 'Arara Azul', acronym: 'AAZ' })).toBe(true);
    });

    it.each([
      ['AGU', true],
      ['AFC', true],
      ['ASC', true],
      ['GUI', false],
      ['AUG', false],
      ['AGX', false],
    ])('%s em "Águias FC" aceito = %s', (acronym, expected) => {
      expect(isAccepted(withFields({ acronym }))).toBe(expected);
    });
  });
});
