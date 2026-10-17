import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { MAX_ID } from '../../../common/pipes/parse-resource-id.pipe';
import { saveLineupSchema } from './save-lineup.schema';

const pipe = new ZodValidationPipe(saveLineupSchema);
const IDS = [34, 31, 30, 33, 32];

function refusal(body: unknown): string {
  try {
    pipe.transform(body);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error('o corpo foi aceito');
}

describe('saveLineupSchema', () => {
  it.each(['3-1', '2-2', '2-1-1', '1-2-1'])(
    'aceita a formação %s',
    (formation) => {
      expect(pipe.transform({ formation, player_ids: IDS })).toEqual({
        formation,
        playerIds: IDS,
      });
    },
  );

  it('aceita os ids nos limites, 1 e o maior id', () => {
    const ids = [1, 2, 3, 4, MAX_ID];

    expect(
      pipe.transform({ formation: '3-1', player_ids: ids }).playerIds,
    ).toEqual(ids);
  });

  it('ignora campos que não existem (V7)', () => {
    expect(
      pipe.transform({ formation: '2-2', player_ids: IDS, playerIds: [1] }),
    ).toEqual({ formation: '2-2', playerIds: IDS });
  });

  it.each([
    [{ player_ids: IDS }, 'formation: é obrigatório'],
    [{ formation: null, player_ids: IDS }, 'formation: é obrigatório'],
    [
      { formation: '4-0', player_ids: IDS },
      'formation: deve ser um de: 3-1, 2-2, 2-1-1, 1-2-1',
    ],
    [
      { formation: '2-1-1 ', player_ids: IDS },
      'formation: deve ser um de: 3-1, 2-2, 2-1-1, 1-2-1',
    ],
    [
      { formation: 211, player_ids: IDS },
      'formation: deve ser um de: 3-1, 2-2, 2-1-1, 1-2-1',
    ],
    [{ formation: '2-1-1' }, 'player_ids: é obrigatório'],
    [{ formation: '2-1-1', player_ids: 34 }, 'player_ids: deve ser uma lista'],
    [
      { formation: '2-1-1', player_ids: '34,31' },
      'player_ids: deve ser uma lista',
    ],
    [
      { formation: '2-1-1', player_ids: [] },
      'player_ids: deve ter exatamente 5 ids',
    ],
    [
      { formation: '2-1-1', player_ids: [34, 31, 30, 33] },
      'player_ids: deve ter exatamente 5 ids',
    ],
    [
      { formation: '2-1-1', player_ids: [...IDS, 35] },
      'player_ids: deve ter exatamente 5 ids',
    ],
    [
      { formation: '2-1-1', player_ids: [34, 31, 30, 33, 34] },
      'player_ids: não pode ter ids repetidos',
    ],
    [
      { formation: '2-1-1', player_ids: [34, 31, 30, 33, 0] },
      'player_ids.4: deve ser no mínimo 1',
    ],
    [
      { formation: '2-1-1', player_ids: [-1, 31, 30, 33, 32] },
      'player_ids.0: deve ser no mínimo 1',
    ],
    [
      { formation: '2-1-1', player_ids: [34, 31, 30, 33, MAX_ID + 1] },
      `player_ids.4: deve ser no máximo ${MAX_ID}`,
    ],
    [
      { formation: '2-1-1', player_ids: [34, 31, 30.5, 33, 32] },
      'player_ids.2: deve ser um número inteiro',
    ],
    [
      { formation: '2-1-1', player_ids: [34, '31', 30, 33, 32] },
      'player_ids.1: deve ser um número inteiro',
    ],
    [
      { formation: '2-1-1', player_ids: [34, null, 30, 33, 32] },
      'player_ids.1: é obrigatório',
    ],
    [[], 'O corpo da requisição deve ser um objeto JSON.'],
  ])('recusa %j com "%s"', (body, message) => {
    expect(refusal(body)).toBe(message);
  });
});
