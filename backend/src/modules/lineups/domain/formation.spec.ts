import { Position } from '../../players/domain/player.types';
import {
  describeFormation,
  fitsFormation,
  Formation,
  isLineupComplete,
} from './formation';

describe('fitsFormation', () => {
  it.each<[Formation, Position[]]>([
    ['3-1', ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA']],
    ['3-1', ['GOL', 'ZAG', 'ZAG', 'ZAG', 'ATA']],
    ['2-2', ['GOL', 'ZAG', 'LAT', 'ATA', 'ATA']],
    ['2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']],
    ['2-1-1', ['ATA', 'MEI', 'GOL', 'LAT', 'LAT']],
    ['1-2-1', ['GOL', 'ZAG', 'MEI', 'MEI', 'ATA']],
    ['1-2-1', ['GOL', 'LAT', 'MEI', 'MEI', 'ATA']],
  ])('aceita %s com %j', (formation, positions) => {
    expect(fitsFormation(positions, formation)).toBe(true);
  });

  it.each<[string, Formation, Position[]]>([
    ['sem goleiro', '2-1-1', ['ZAG', 'ZAG', 'LAT', 'MEI', 'ATA']],
    ['com dois goleiros', '2-1-1', ['GOL', 'GOL', 'LAT', 'MEI', 'ATA']],
    ['com um defensor a menos', '3-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']],
    ['com um defensor a mais', '2-2', ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA']],
    ['com meio no lugar do ataque', '2-2', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']],
    ['sem o meio pedido', '1-2-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']],
    ['sem atacante', '2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'MEI']],
    ['com 4 jogadores', '2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI']],
    ['com 6 jogadores', '2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA', 'ATA']],
  ])('recusa %s', (_, formation, positions) => {
    expect(fitsFormation(positions, formation)).toBe(false);
  });
});

describe('describeFormation', () => {
  it.each<[Formation, string]>([
    ['3-1', '1 GOL, 3 entre ZAG e LAT e 1 ATA'],
    ['2-2', '1 GOL, 2 entre ZAG e LAT e 2 ATA'],
    ['2-1-1', '1 GOL, 2 entre ZAG e LAT, 1 MEI e 1 ATA'],
    ['1-2-1', '1 GOL, 1 entre ZAG e LAT, 2 MEI e 1 ATA'],
  ])('%s pede %s', (formation, text) => {
    expect(describeFormation(formation)).toBe(text);
  });
});

describe('isLineupComplete', () => {
  it.each<[string | null, number, boolean]>([
    ['2-1-1', 5, true],
    ['2-1-1', 4, false],
    ['3-1', 0, false],
    [null, 0, false],
    [null, 5, false],
  ])('formação %s com %i titulares → %s', (formation, starters, complete) => {
    expect(isLineupComplete(formation, starters)).toBe(complete);
  });
});
