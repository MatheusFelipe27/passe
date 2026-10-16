import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { listTransactionsQuerySchema } from './list-transactions.query';

const pipe = new ZodValidationPipe(listTransactionsQuerySchema);

function refusal(query: Record<string, string>): string {
  try {
    pipe.transform(query);
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (error as BadRequestException).message;
  }
  throw new Error('a query foi aceita');
}

const TYPE_MESSAGE =
  'type: deve ter um ou mais de COMPRA, VENDA, separados por vírgula, sem espaços e sem repetir';

describe('listTransactionsQuerySchema', () => {
  it('sem filtros, não filtra', () => {
    expect(pipe.transform({})).toEqual({
      types: undefined,
      playerId: undefined,
    });
  });

  it('ignora os parâmetros que não são da tabela', () => {
    expect(pipe.transform({ sort: 'x', page: '2' })).toEqual({
      types: undefined,
      playerId: undefined,
    });
  });

  it.each([
    ['COMPRA', ['COMPRA']],
    ['VENDA', ['VENDA']],
    ['COMPRA,VENDA', ['COMPRA', 'VENDA']],
    ['VENDA,COMPRA', ['VENDA', 'COMPRA']],
  ])('aceita type=%s', (type, types) => {
    expect(pipe.transform({ type })).toMatchObject({ types });
  });

  it.each([
    ['vazio', ''],
    ['em minúsculas', 'compra'],
    ['com um em minúsculas', 'COMPRA,venda'],
    ['repetido', 'COMPRA,COMPRA'],
    ['com vírgula sobrando', 'COMPRA,'],
    ['com vírgula no início', ',VENDA'],
    ['com espaço', 'COMPRA, VENDA'],
    ['com espaço em volta', ' COMPRA'],
    ['com outro separador', 'COMPRA;VENDA'],
    ['desconhecido', 'TROCA'],
  ])('recusa type %s', (_, type) => {
    expect(refusal({ type })).toBe(TYPE_MESSAGE);
  });

  it.each([
    ['1', 1],
    ['25', 25],
    ['2147483647', 2147483647],
  ])('aceita player_id=%s', (playerId, expected) => {
    expect(pipe.transform({ player_id: playerId })).toMatchObject({
      playerId: expected,
    });
  });

  it.each(['', '0', '01', '-1', '+1', '1.5', '1e2', 'abc', ' 1', '2147483648'])(
    'recusa player_id=%j',
    (playerId) => {
      expect(refusal({ player_id: playerId })).toMatch(/^player_id: /);
    },
  );

  it('combina os dois filtros', () => {
    expect(pipe.transform({ type: 'VENDA', player_id: '2' })).toEqual({
      types: ['VENDA'],
      playerId: 2,
    });
  });
});
