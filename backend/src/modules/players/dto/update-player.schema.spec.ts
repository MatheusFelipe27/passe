import { updatePlayerSchema } from './update-player.schema';

const validEdit = { name: 'Davi Melo', position: 'MEI', agility: 70, age: 23 };

function isAccepted(body: unknown): boolean {
  return updatePlayerSchema.safeParse(body).success;
}

function withFields(fields: Record<string, unknown>): Record<string, unknown> {
  return { ...validEdit, ...fields };
}

describe('updatePlayerSchema', () => {
  it('aceita a edição válida e devolve os quatro campos', () => {
    expect(updatePlayerSchema.parse(validEdit)).toEqual(validEdit);
  });

  it.each([[[]], ['x'], [10], [null], [undefined]])(
    'recusa o corpo %j',
    (body) => {
      expect(isAccepted(body)).toBe(false);
    },
  );

  it.each(Object.keys(validEdit))(
    'exige %s, mesmo que só outro campo mude',
    (field) => {
      const body = Object.fromEntries(
        Object.entries(validEdit).filter(([key]) => key !== field),
      );

      expect(isAccepted(body)).toBe(false);
      expect(isAccepted(withFields({ [field]: null }))).toBe(false);
    },
  );

  it('ignora indicadores, potencial, valor base, condição e clube', () => {
    const body = withFields({
      pace: 1,
      shooting: 1,
      passing: 1,
      dribbling: 1,
      defending: 1,
      physical: 1,
      potential: 1,
      overall: 1,
      base_value: 1,
      market_value: 1,
      condition: 'DOENTE',
      club_id: 3,
      id: 99,
    });

    expect(updatePlayerSchema.parse(body)).toEqual(validEdit);
  });

  it('normaliza os espaços do nome', () => {
    expect(
      updatePlayerSchema.parse(withFields({ name: '  Davi   Melo ' })).name,
    ).toBe('Davi Melo');
  });

  it.each(['Davi', 'Davi Melo 2', 'Davi\tMelo', '  ', 'AB'])(
    'recusa o nome %j',
    (name) => {
      expect(isAccepted(withFields({ name }))).toBe(false);
    },
  );

  it.each([
    ['position', 'mei'],
    ['position', 'VOL'],
    ['agility', '70'],
    ['agility', 70.5],
    ['agility', 0],
    ['agility', 101],
    ['age', '23'],
    ['age', 15],
    ['age', 46],
  ])('recusa %s = %j', (field, value) => {
    expect(isAccepted(withFields({ [field]: value }))).toBe(false);
  });

  it.each([
    ['agility', 1],
    ['agility', 100],
    ['age', 16],
    ['age', 45],
  ])('aceita %s = %j no limite', (field, value) => {
    const body = withFields({
      [field]: value,
      agility: field === 'agility' ? value : 50,
    });

    expect(isAccepted(body)).toBe(true);
  });

  it.each([
    [34, 100, true],
    [35, 85, true],
    [35, 86, false],
    [45, 85, true],
    [45, 86, false],
  ])('com %i anos e agilidade %i aceito = %s', (age, agility, expected) => {
    expect(isAccepted(withFields({ age, agility }))).toBe(expected);
  });
});
