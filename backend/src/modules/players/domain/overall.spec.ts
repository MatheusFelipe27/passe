import { calculateOverall } from './overall';
import { PlayerAttributes, Position } from './player.types';

function attributes(values: number[]): PlayerAttributes {
  const [pace, shooting, passing, dribbling, defending, physical] = values;
  return { pace, shooting, passing, dribbling, defending, physical };
}

describe('calculateOverall', () => {
  it.each<[Position, number[], number]>([
    ['MEI', [68, 65, 80, 78, 52, 60], 73],
    ['ATA', [78, 75, 73, 82, 48, 68], 76],
    ['LAT', [72, 70, 78, 76, 70, 66], 72],
    ['GOL', [55, 30, 65, 40, 72, 68], 68],
    ['ZAG', [60, 30, 55, 40, 81, 77], 74],
    ['ATA', [80, 77, 60, 74, 30, 70], 75],
  ])('%s com atributos %j tem overall %i', (position, values, expected) => {
    expect(calculateOverall(position, attributes(values))).toBe(expected);
  });

  it.each<[Position, number[], number]>([
    ['ZAG', [50, 90, 60, 40, 80, 75], 73],
    ['LAT', [60, 40, 60, 60, 62, 60], 61],
  ])('arredonda o meio para cima: %s %j → %i', (position, values, expected) => {
    expect(calculateOverall(position, attributes(values))).toBe(expected);
  });

  it.each<[Position, number[], number]>([
    ['ZAG', [48, 90, 61, 40, 80, 75], 72],
    ['ZAG', [49, 90, 61, 40, 80, 75], 73],
    ['LAT', [60, 40, 60, 60, 62, 60], 61],
    ['LAT', [61, 40, 59, 60, 62, 60], 61],
    ['LAT', [59, 40, 61, 60, 62, 60], 60],
  ])('arredonda em volta do meio: %s %j → %i', (position, values, expected) => {
    expect(calculateOverall(position, attributes(values))).toBe(expected);
  });

  it.each<Position>(['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'])(
    'vai de 1 a 99 nos extremos dos atributos: %s',
    (position) => {
      const lowest = attributes([1, 1, 1, 1, 1, 1]);
      const highest = attributes([99, 99, 99, 99, 99, 99]);

      expect(calculateOverall(position, lowest)).toBe(1);
      expect(calculateOverall(position, highest)).toBe(99);
    },
  );

  it('ignora os atributos com peso zero na posição', () => {
    const lowShooting = attributes([50, 1, 60, 1, 80, 75]);
    const highShooting = attributes([50, 99, 60, 99, 80, 75]);

    expect(calculateOverall('ZAG', lowShooting)).toBe(
      calculateOverall('ZAG', highShooting),
    );
  });
});
