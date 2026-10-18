import { describe, expect, it } from 'vitest';
import type { Formation } from '@/api/league';
import type { Player, Position } from '@/api/players';
import {
  assignPlayers,
  fitsSomeFormation,
  sectorOf,
  slotsOf,
  usedAttributes,
} from './formations';

function player(id: number, position: Position): Player {
  return {
    id,
    name: `Jogador ${id}`,
    position,
    agility: 50,
    age: 25,
    condition: 'APTO',
    base_value: 10,
    market_value: 10,
    pace: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defending: 50,
    physical: 50,
    potential: 60,
    overall: 50,
    club_id: 1,
  };
}

function squad(...positions: Position[]): Player[] {
  return positions.map((position, index) => player(index + 1, position));
}

describe('slotsOf', () => {
  it.each<[Formation, string[]]>([
    ['3-1', ['GOL-0', 'DEF-0', 'DEF-1', 'DEF-2', 'ATA-0']],
    ['2-2', ['GOL-0', 'DEF-0', 'DEF-1', 'ATA-0', 'ATA-1']],
    ['2-1-1', ['GOL-0', 'DEF-0', 'DEF-1', 'MEI-0', 'ATA-0']],
    ['1-2-1', ['GOL-0', 'DEF-0', 'MEI-0', 'MEI-1', 'ATA-0']],
  ])('%s tem 5 vagas, do goleiro ao ataque', (formation, keys) => {
    const slots = slotsOf(formation);

    expect(slots.map((slot) => slot.key)).toEqual(keys);
  });

  it('cada vaga sabe a sua posição e o tamanho do setor', () => {
    expect(slotsOf('1-2-1')[3]).toEqual({
      key: 'MEI-1',
      sector: 'MEI',
      index: 1,
      count: 2,
    });
  });
});

describe('sectorOf', () => {
  it.each<[Position, string]>([
    ['GOL', 'GOL'],
    ['ZAG', 'DEF'],
    ['LAT', 'DEF'],
    ['MEI', 'MEI'],
    ['ATA', 'ATA'],
  ])('%s fica no setor %s', (position, sector) => {
    expect(sectorOf(position)).toBe(sector);
  });
});

describe('assignPlayers', () => {
  it('põe cada titular na vaga do setor dele, em qualquer ordem recebida', () => {
    const players = squad('ATA', 'LAT', 'GOL', 'MEI', 'ZAG');

    expect(assignPlayers('2-1-1', players)).toEqual({
      'GOL-0': 3,
      'DEF-0': 2,
      'DEF-1': 5,
      'MEI-0': 4,
      'ATA-0': 1,
    });
  });

  it('deixa vazia a vaga sem jogador do setor', () => {
    expect(assignPlayers('2-1-1', squad('GOL', 'ZAG', 'MEI', 'ATA'))).toEqual({
      'GOL-0': 1,
      'DEF-0': 2,
      'MEI-0': 3,
      'ATA-0': 4,
    });
  });

  it('sem jogadores, todas as vagas ficam vazias', () => {
    expect(assignPlayers('3-1', [])).toEqual({});
  });

  it('ao trocar de formação, mantém quem cabe e descarta o que sobra no setor', () => {
    const chosen = squad('GOL', 'ZAG', 'LAT', 'MEI', 'ATA');

    expect(assignPlayers('1-2-1', chosen)).toEqual({
      'GOL-0': 1,
      'DEF-0': 2,
      'MEI-0': 4,
      'ATA-0': 5,
    });
    expect(assignPlayers('3-1', chosen)).toEqual({
      'GOL-0': 1,
      'DEF-0': 2,
      'DEF-1': 3,
      'ATA-0': 5,
    });
    expect(assignPlayers('2-2', chosen)).toEqual({
      'GOL-0': 1,
      'DEF-0': 2,
      'DEF-1': 3,
      'ATA-0': 5,
    });
  });

  it('dois goleiros: só o primeiro entra', () => {
    expect(assignPlayers('2-1-1', squad('GOL', 'GOL'))).toEqual({ 'GOL-0': 1 });
  });
});

describe('fitsSomeFormation', () => {
  it.each<[string, Position[]]>([
    ['o 2-1-1 exato', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']],
    [
      'o 3-1 só com defensores e um atacante',
      ['GOL', 'ZAG', 'ZAG', 'LAT', 'ATA'],
    ],
    ['o 2-2', ['GOL', 'ZAG', 'LAT', 'ATA', 'ATA']],
    ['o 1-2-1', ['GOL', 'ZAG', 'MEI', 'MEI', 'ATA']],
    ['jogadores de sobra', ['GOL', 'GOL', 'ZAG', 'LAT', 'MEI', 'MEI', 'ATA']],
  ])('fecha com %s', (_, positions) => {
    expect(fitsSomeFormation(squad(...positions))).toBe(true);
  });

  it.each<[string, Position[]]>([
    ['nenhum jogador', []],
    ['4 jogadores', ['GOL', 'ZAG', 'MEI', 'ATA']],
    ['sem goleiro', ['ZAG', 'LAT', 'ZAG', 'MEI', 'ATA']],
    ['sem atacante', ['GOL', 'ZAG', 'LAT', 'MEI', 'MEI']],
    ['sem defensor', ['GOL', 'MEI', 'MEI', 'ATA', 'ATA']],
    ['só 1 defensor e 1 meio', ['GOL', 'ZAG', 'MEI', 'ATA', 'GOL']],
  ])('não fecha com %s', (_, positions) => {
    expect(fitsSomeFormation(squad(...positions))).toBe(false);
  });
});

describe('usedAttributes', () => {
  it.each<[Position, string[]]>([
    ['GOL', ['defending']],
    ['ZAG', ['defending']],
    ['LAT', ['dribbling', 'defending']],
    ['MEI', ['passing']],
    ['ATA', ['shooting']],
  ])('%s usa %j', (position, attributes) => {
    expect(usedAttributes(position)).toEqual(attributes);
  });
});
