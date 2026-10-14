const CONTROL_CHARACTER = /\p{Cc}/u;
const EDGE_SPACES = /^ +| +$/g;
const REPEATED_SPACES = / {2,}/g;
const ACCENT_MARK = /\p{Mn}/gu;
const LETTER = /\p{L}/u;
const DIGIT = /[0-9]/;

export function hasControlCharacter(text: string): boolean {
  return CONTROL_CHARACTER.test(text);
}

// V4: tira os espaços das pontas e junta os repetidos.
export function normalizeSpaces(text: string): string {
  return text.replace(EDGE_SPACES, '').replace(REPEATED_SPACES, ' ');
}

// V4: caractere é um ponto de código Unicode.
export function countCharacters(text: string): number {
  return Array.from(text).length;
}

// V4: palavra é uma sequência sem espaços com pelo menos uma letra.
export function countWords(text: string): number {
  return text.split(' ').filter((part) => LETTER.test(part)).length;
}

export function hasDigit(text: string): boolean {
  return DIGIT.test(text);
}

// V4: ignorar acentos é decompor em NFD e retirar as marcas (categoria Mn).
export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(ACCENT_MARK, '');
}

// Premissas: a ordem alfabética compara os nomes em minúsculas e sem acentos.
export function toSortKey(text: string): string {
  return removeAccents(text.toLowerCase());
}
