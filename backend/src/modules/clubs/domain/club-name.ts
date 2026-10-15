import { removeAccents } from '../../../common/text/text';

const ALLOWED_CHARACTERS = /^[\p{L}\p{Mn} .-]+$/u;
const LETTER = /\p{L}/u;

// Limites do nome do clube: só letras (com ou sem acento), espaços, hífen e ponto.
export function hasOnlyClubNameCharacters(name: string): boolean {
  return ALLOWED_CHARACTERS.test(name);
}

// RN10: o nome é único depois da V4, sem diferenciar maiúsculas, mas considerando acentos.
export function toClubNameKey(name: string): string {
  return name.toLowerCase();
}

// Limites da sigla: as 3 letras aparecem no nome nessa ordem, sem diferenciar maiúsculas e acentos,
// e a primeira delas é a primeira letra do nome.
export function acronymMatchesName(acronym: string, name: string): boolean {
  const letters = Array.from(removeAccents(name).toUpperCase()).filter(
    (character) => LETTER.test(character),
  );
  const [first, ...rest] = Array.from(acronym);
  if (letters[0] !== first) {
    return false;
  }
  let position = 1;
  for (const letter of rest) {
    const found = letters.indexOf(letter, position);
    if (found === -1) {
      return false;
    }
    position = found + 1;
  }
  return true;
}
