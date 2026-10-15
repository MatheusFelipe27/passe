import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { buyPlayerSchema } from './buy-player.schema';

const pipe = new ZodValidationPipe(buyPlayerSchema);

const VALID = { club_id: 1, loyalty_until: '2027-03-02T10:15-03:00' };

function refusal(body: unknown): string {
  try {
    pipe.transform(body);
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (error as BadRequestException).message;
  }
  throw new Error('o corpo foi aceito');
}

const FORMAT_MESSAGE =
  'loyalty_until: deve ser uma data e hora existentes no formato AAAA-MM-DDTHH:MM-03:00';

describe('buyPlayerSchema', () => {
  it('aceita o corpo do exemplo e converte a data para o instante', () => {
    expect(pipe.transform(VALID)).toEqual({
      clubId: 1,
      loyaltyUntil: new Date('2027-03-02T13:15:00.000Z'),
    });
  });

  it('ignora os campos que não pertencem à compra', () => {
    expect(
      pipe.transform({ ...VALID, cash: 1000, price: 1, player_id: 9 }),
    ).toEqual({
      clubId: 1,
      loyaltyUntil: new Date('2027-03-02T13:15:00.000Z'),
    });
  });

  describe('club_id', () => {
    it.each([
      [1, true],
      [2_147_483_647, true],
      [1.0, true],
    ])('aceita %s', (clubId, _) => {
      expect(pipe.transform({ ...VALID, club_id: clubId })).toMatchObject({
        clubId,
      });
    });

    it.each([
      ['ausente', undefined, 'club_id: é obrigatório'],
      ['nulo', null, 'club_id: é obrigatório'],
      ['zero', 0, 'club_id: deve ser no mínimo 1'],
      ['negativo', -1, 'club_id: deve ser no mínimo 1'],
      ['fracionário', 1.5, 'club_id: deve ser um número inteiro'],
      ['texto', '1', 'club_id: deve ser um número inteiro'],
      [
        'acima do maior id',
        2_147_483_648,
        'club_id: deve ser no máximo 2147483647',
      ],
    ])('recusa %s', (_, clubId, message) => {
      expect(refusal({ ...VALID, club_id: clubId })).toBe(message);
    });

    it('recusa clubId fora do snake_case como campo ausente', () => {
      expect(refusal({ clubId: 1, loyalty_until: VALID.loyalty_until })).toBe(
        'club_id: é obrigatório',
      );
    });
  });

  describe('loyalty_until', () => {
    it.each([
      ['ausente', undefined, 'loyalty_until: é obrigatório'],
      ['nulo', null, 'loyalty_until: é obrigatório'],
      ['número', 20270302, 'loyalty_until: deve ser um texto'],
      ['sem o fuso', '2027-03-02T10:15', FORMAT_MESSAGE],
      ['com segundos', '2027-03-02T10:15:00-03:00', FORMAT_MESSAGE],
      ['em UTC', '2027-03-02T13:15Z', FORMAT_MESSAGE],
      ['data inexistente', '2027-02-30T10:15-03:00', FORMAT_MESSAGE],
      ['hora inexistente', '2027-03-02T24:00-03:00', FORMAT_MESSAGE],
    ])('recusa %s', (_, loyaltyUntil, message) => {
      expect(refusal({ ...VALID, loyalty_until: loyaltyUntil })).toBe(message);
    });
  });

  it.each([
    ['lista', []],
    ['texto', 'x'],
    ['número', 10],
  ])('recusa corpo que é %s', (_, body) => {
    expect(refusal(body)).toBe(
      'O corpo da requisição deve ser um objeto JSON.',
    );
  });
});
