import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

const schema = z.object({
  name: z.string(),
  age: z.number().int().min(16).max(45),
  position: z.enum(['GOL', 'ATA']),
});

const valid = { name: 'Meia Lua', age: 20, position: 'GOL' };

function messageFor(value: unknown): string {
  try {
    new ZodValidationPipe(schema).transform(value);
  } catch (error) {
    if (error instanceof BadRequestException) {
      return error.message;
    }
  }
  return '';
}

describe('ZodValidationPipe', () => {
  it('devolve o valor validado, sem os campos desconhecidos', () => {
    const pipe = new ZodValidationPipe(schema);

    expect(pipe.transform({ ...valid, extra: true })).toEqual(valid);
  });

  it.each([
    ['array', []],
    ['texto', 'x'],
    ['número', 10],
    ['nulo', null],
    ['ausente', undefined],
  ])('recusa o corpo que não é objeto: %s', (_description, body) => {
    expect(messageFor(body)).toBe(
      'O corpo da requisição deve ser um objeto JSON.',
    );
  });

  it.each([
    ['campo ausente', { ...valid, name: undefined }, 'name: é obrigatório'],
    ['campo nulo', { ...valid, name: null }, 'name: é obrigatório'],
    [
      'lista ausente',
      { ...valid, position: undefined },
      'position: é obrigatório',
    ],
    ['lista nula', { ...valid, position: null }, 'position: é obrigatório'],
    ['número ausente', { ...valid, age: undefined }, 'age: é obrigatório'],
    ['texto com outro tipo', { ...valid, name: 10 }, 'name: deve ser um texto'],
    [
      'número como texto',
      { ...valid, age: '20' },
      'age: deve ser um número inteiro',
    ],
    [
      'número fracionário',
      { ...valid, age: 20.5 },
      'age: deve ser um número inteiro',
    ],
    ['abaixo do mínimo', { ...valid, age: 15 }, 'age: deve ser no mínimo 16'],
    ['acima do máximo', { ...valid, age: 46 }, 'age: deve ser no máximo 45'],
    [
      'fora da lista',
      { ...valid, position: 'gol' },
      'position: deve ser um de: GOL, ATA',
    ],
  ])('mensagem de %s', (_description, body, expected) => {
    expect(messageFor(body)).toBe(expected);
  });

  it.each([
    ['no mínimo', { ...valid, age: 16 }],
    ['no máximo', { ...valid, age: 45 }],
  ])('aceita o valor %s', (_description, body) => {
    expect(messageFor(body)).toBe('');
  });

  it('mantém a mensagem escrita na própria regra', () => {
    const pipe = new ZodValidationPipe(
      z.object({
        name: z.string().refine((name) => name.includes(' '), {
          message: 'deve ter pelo menos 2 palavras',
        }),
      }),
    );

    expect(() => pipe.transform({ name: 'Meia' })).toThrow(
      'name: deve ter pelo menos 2 palavras',
    );
  });
});
