import {
  countCharacters,
  countWords,
  hasControlCharacter,
  hasDigit,
  normalizeSpaces,
  removeAccents,
  toSortKey,
} from './text';

describe('normalizeSpaces', () => {
  it.each([
    ['  Meia   Zeta ', 'Meia Zeta'],
    ['Meia Zeta', 'Meia Zeta'],
    [' Meia Zeta', 'Meia Zeta'],
    ['Meia Zeta ', 'Meia Zeta'],
    ['Meia  Zeta', 'Meia Zeta'],
    ['   ', ''],
    ['', ''],
  ])('"%s" vira "%s"', (text, expected) => {
    expect(normalizeSpaces(text)).toBe(expected);
  });

  it('só trata o espaço comum (U+0020)', () => {
    const noBreakSpace = String.fromCodePoint(0xa0);
    const text = `${noBreakSpace}Meia${noBreakSpace}${noBreakSpace}Zeta`;

    expect(normalizeSpaces(text)).toBe(text);
  });
});

describe('hasControlCharacter', () => {
  it.each(['Meia\tLua', 'Meia\nLua', 'Meia\rLua', '\u0000Meia', 'Meia\u007f'])(
    'encontra em %j',
    (text) => {
      expect(hasControlCharacter(text)).toBe(true);
    },
  );

  it.each(['Meia Lua', 'Zé "Foguete" Lima', 'Ana-Maria; Lima', ''])(
    'não encontra em %j',
    (text) => {
      expect(hasControlCharacter(text)).toBe(false);
    },
  );
});

describe('countCharacters', () => {
  it.each([
    ['', 0],
    ['abc', 3],
    ['Zé', 2],
    ['𝐀𝐁', 2],
  ])('"%s" tem %i caracteres', (text, expected) => {
    expect(countCharacters(text)).toBe(expected);
  });
});

describe('countWords', () => {
  it.each([
    ['', 0],
    ['Meia', 1],
    ['Meia Lua', 2],
    ['Meia-Lua', 1],
    ['Meia -', 1],
    ['- -', 0],
    ['Meia 10', 1],
    ['Meia L', 2],
    ['Águias Futebol Clube', 3],
  ])('"%s" tem %i palavras', (text, expected) => {
    expect(countWords(text)).toBe(expected);
  });
});

describe('hasDigit', () => {
  it.each(['Meia 0', 'Meia 9', 'Lua2'])('encontra em "%s"', (text) => {
    expect(hasDigit(text)).toBe(true);
  });

  it.each(['Meia Lua', 'Meia Ⅷ', ''])('não encontra em "%s"', (text) => {
    expect(hasDigit(text)).toBe(false);
  });
});

describe('removeAccents', () => {
  it.each([
    ['João', 'Joao'],
    ['Águias', 'Aguias'],
    ['Conceição', 'Conceicao'],
    ['Épsilon', 'Epsilon'],
    ['Delta', 'Delta'],
  ])('"%s" vira "%s"', (text, expected) => {
    expect(removeAccents(text)).toBe(expected);
  });
});

describe('toSortKey', () => {
  it.each([
    ['Épsilon', 'epsilon'],
    ['Águias FC', 'aguias fc'],
    ['Aguias FC', 'aguias fc'],
    ['Ana-Maria', 'ana-maria'],
  ])('"%s" vira "%s"', (text, expected) => {
    expect(toSortKey(text)).toBe(expected);
  });

  it('mantém a ordem do enunciado: espaço, hífen e letras', () => {
    const names = ['Gama', 'Ana-Maria', 'Épsilon', 'Ana Lima', 'Delta'];

    const sorted = [...names].sort((a, b) =>
      toSortKey(a) < toSortKey(b) ? -1 : 1,
    );

    expect(sorted).toEqual([
      'Ana Lima',
      'Ana-Maria',
      'Delta',
      'Épsilon',
      'Gama',
    ]);
  });
});
