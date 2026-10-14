import { NotFoundException } from '@nestjs/common';
import { ParseResourceIdPipe } from './parse-resource-id.pipe';

describe('ParseResourceIdPipe', () => {
  const pipe = new ParseResourceIdPipe();

  it.each([
    ['1', 1],
    ['9', 9],
    ['10', 10],
    ['2147483646', 2147483646],
    ['2147483647', 2147483647],
  ])('aceita "%s"', (value, expected) => {
    expect(pipe.transform(value)).toBe(expected);
  });

  it.each([
    'abc',
    '0',
    '-1',
    '1.5',
    '1.0',
    '01',
    '+1',
    '1e3',
    ' 1',
    '1 ',
    '',
    '2147483648',
    '99999999999999999999',
  ])('trata "%s" como recurso inexistente', (value) => {
    expect(() => pipe.transform(value)).toThrow(NotFoundException);
  });
});
