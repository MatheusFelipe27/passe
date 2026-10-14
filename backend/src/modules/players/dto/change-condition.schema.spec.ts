import { changeConditionSchema } from './change-condition.schema';

function isAccepted(body: unknown): boolean {
  return changeConditionSchema.safeParse(body).success;
}

describe('changeConditionSchema', () => {
  it.each(['APTO', 'MAL_CONDICIONADO', 'DOENTE'])('aceita %s', (condition) => {
    expect(changeConditionSchema.parse({ condition })).toEqual({ condition });
  });

  it.each([
    'apto',
    'Apto',
    'mal_condicionado',
    'MAL CONDICIONADO',
    ' DOENTE',
    '',
    'MACHUCADO',
    1,
    true,
    null,
    undefined,
  ])('recusa a condição %j', (condition) => {
    expect(isAccepted({ condition })).toBe(false);
  });

  it.each([[[]], ['APTO'], [10], [null], [undefined]])(
    'recusa o corpo %j',
    (body) => {
      expect(isAccepted(body)).toBe(false);
    },
  );

  it('recusa o campo fora do snake_case', () => {
    expect(isAccepted({ Condition: 'APTO' })).toBe(false);
  });

  it('ignora os campos de outros endpoints', () => {
    const body = { condition: 'DOENTE', name: 'Outro Nome', age: 40 };

    expect(changeConditionSchema.parse(body)).toEqual({ condition: 'DOENTE' });
  });
});
