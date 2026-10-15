import { Position } from './player.types';
import { compareRosterOrder } from './roster-order';

function member(id: number, position: Position, name: string) {
  return { id, position, name };
}

describe('compareRosterOrder', () => {
  it('ordena GOL, ZAG, LAT, MEI e ATA, e não pela ordem alfabética', () => {
    const roster = [
      member(1, 'ATA', 'Ana Atacante'),
      member(2, 'MEI', 'Bia Meia'),
      member(3, 'LAT', 'Caio Lateral'),
      member(4, 'ZAG', 'Davi Zagueiro'),
      member(5, 'GOL', 'Ezequiel Goleiro'),
    ];

    expect(
      roster.sort(compareRosterOrder).map((item) => item.position),
    ).toEqual(['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']);
  });

  it('na mesma posição, segue o nome sem acentos e depois o id', () => {
    const roster = [
      member(9, 'MEI', 'Sávio Lima'),
      member(3, 'MEI', 'Lucas Ferraz'),
      member(8, 'MEI', 'Élio Souza'),
      member(5, 'MEI', 'Elio Souza'),
      member(2, 'MEI', 'Ana-Maria Reis'),
      member(7, 'MEI', 'Ana Maria'),
    ];

    expect(roster.sort(compareRosterOrder).map((item) => item.id)).toEqual([
      7, 2, 5, 8, 3, 9,
    ]);
  });
});
