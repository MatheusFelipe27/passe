import {
  acronymMatchesName,
  hasOnlyClubNameCharacters,
  toClubNameKey,
} from './club-name';

describe('hasOnlyClubNameCharacters', () => {
  it.each([
    'Águias FC',
    'F.C. Porto',
    'Santa-Cruz FC',
    'Ação Clube',
    'Ñandú FC',
  ])('aceita %j', (name) => {
    expect(hasOnlyClubNameCharacters(name)).toBe(true);
  });

  it.each([
    'Águias FC 1',
    'Águias_FC',
    'Águias, FC',
    "Águias' FC",
    'Águias/FC',
  ])('recusa %j', (name) => {
    expect(hasOnlyClubNameCharacters(name)).toBe(false);
  });
});

describe('toClubNameKey', () => {
  it.each([
    ['Águias FC', 'águias fc'],
    ['ÁGUIAS FC', 'águias fc'],
    ['Aguias FC', 'aguias fc'],
  ])('%s vira %s', (name, key) => {
    expect(toClubNameKey(name)).toBe(key);
  });

  it('diferencia acentos e ignora maiúsculas, como pede a RN10', () => {
    expect(toClubNameKey('Águias FC')).toBe(toClubNameKey('águias fc'));
    expect(toClubNameKey('Águias FC')).not.toBe(toClubNameKey('Aguias FC'));
  });
});

describe('acronymMatchesName', () => {
  it.each([
    ['AGU', 'Águias FC', true],
    ['AFC', 'Águias FC', true],
    ['ASC', 'Águias FC', true],
    ['AAS', 'Águias FC', true],
    ['GUI', 'Águias FC', false],
    ['AUG', 'Águias FC', false],
    ['SPF', 'São Paulo FC', true],
    ['CCS', 'Conceição Clube Sul', true],
    ['DEF', 'Delta FC', true],
    ['DCF', 'Delta FC', false],
    ['DFC', 'Delta FC', true],
    ['DFC', '-Delta FC', true],
    ['AAZ', 'Arara Azul', true],
    ['AZA', 'Arara Azul', false],
  ])('%s em %j = %s', (acronym, name, expected) => {
    expect(acronymMatchesName(acronym, name)).toBe(expected);
  });
});
