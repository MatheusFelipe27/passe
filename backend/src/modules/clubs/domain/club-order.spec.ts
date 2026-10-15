import { sortClubs } from './club-order';

const CLUBS = [
  { id: 1, name: 'Gama SC', net_worth: 300 },
  { id: 2, name: 'Épsilon EC', net_worth: 280.5 },
  { id: 3, name: 'Delta FC', net_worth: 310 },
  { id: 4, name: 'Águias FC', net_worth: 300 },
  { id: 5, name: 'Aguias FC', net_worth: 300 },
  { id: 6, name: 'Ana Lima FC', net_worth: 299.99 },
  { id: 7, name: 'Ana-Maria FC', net_worth: 300.01 },
];

function names(sort: 'name' | 'net_worth_asc' | 'net_worth_desc') {
  return sortClubs(CLUBS, sort).map((club) => club.name);
}

describe('sortClubs', () => {
  it('ordena pelo nome sem acentos, com espaço antes do hífen e empate pelo id', () => {
    expect(names('name')).toEqual([
      'Águias FC',
      'Aguias FC',
      'Ana Lima FC',
      'Ana-Maria FC',
      'Delta FC',
      'Épsilon EC',
      'Gama SC',
    ]);
  });

  it('ordena pelo patrimônio, do maior para o menor, com desempate pelo nome e pelo id', () => {
    expect(names('net_worth_desc')).toEqual([
      'Delta FC',
      'Ana-Maria FC',
      'Águias FC',
      'Aguias FC',
      'Gama SC',
      'Ana Lima FC',
      'Épsilon EC',
    ]);
  });

  it('ordena pelo patrimônio, do menor para o maior, com o mesmo desempate', () => {
    expect(names('net_worth_asc')).toEqual([
      'Épsilon EC',
      'Ana Lima FC',
      'Águias FC',
      'Aguias FC',
      'Gama SC',
      'Ana-Maria FC',
      'Delta FC',
    ]);
  });

  it('não altera a lista recebida', () => {
    const before = CLUBS.map((club) => club.id);

    sortClubs(CLUBS, 'net_worth_desc');

    expect(CLUBS.map((club) => club.id)).toEqual(before);
  });
});
