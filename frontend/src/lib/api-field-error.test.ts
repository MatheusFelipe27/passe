import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/http-client';
import { readApiFieldError } from './api-field-error';

describe('readApiFieldError', () => {
  it.each([
    [400, 'acronym: deve ter exatamente 3 letras'],
    [409, 'name: já existe um clube com o nome Águias FC'],
  ])('lê o campo da recusa %i', (status, message) => {
    const [field, text] = message.split(': ');

    expect(readApiFieldError(new ApiError(message, status))).toEqual({
      field,
      message: `${text.charAt(0).toUpperCase()}${text.slice(1)}.`,
    });
  });

  it.each([404, 500, 0])('ignora a recusa %i, mesmo no formato', (status) => {
    expect(
      readApiFieldError(new ApiError('name: não encontrado', status)),
    ).toBeUndefined();
  });

  it.each([
    'A liga já tem 20 clubes, o máximo permitido.',
    'Jogador com clube não pode mudar de posição.',
    'O corpo da requisição deve ser um objeto JSON.',
  ])('ignora a recusa que não aponta um campo: %s', (message) => {
    expect(readApiFieldError(new ApiError(message, 409))).toBeUndefined();
  });

  it('ignora erros que não vieram da API', () => {
    expect(readApiFieldError(new Error('name: falha'))).toBeUndefined();
  });
});
