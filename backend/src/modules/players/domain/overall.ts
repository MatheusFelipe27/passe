import { ATTRIBUTES, PlayerAttributes, Position } from './player.types';

const WEIGHT_TOTAL = 100;

// RN06: peso de cada atributo por posição, em %.
const ATTRIBUTE_WEIGHTS: Record<Position, PlayerAttributes> = {
  GOL: {
    pace: 10,
    shooting: 0,
    passing: 20,
    dribbling: 0,
    defending: 40,
    physical: 30,
  },
  ZAG: {
    pace: 10,
    shooting: 0,
    passing: 15,
    dribbling: 0,
    defending: 45,
    physical: 30,
  },
  LAT: {
    pace: 25,
    shooting: 0,
    passing: 20,
    dribbling: 15,
    defending: 25,
    physical: 15,
  },
  MEI: {
    pace: 10,
    shooting: 15,
    passing: 35,
    dribbling: 25,
    defending: 5,
    physical: 10,
  },
  ATA: {
    pace: 20,
    shooting: 40,
    passing: 10,
    dribbling: 20,
    defending: 0,
    physical: 10,
  },
};

export function calculateOverall(
  position: Position,
  attributes: PlayerAttributes,
): number {
  const weights = ATTRIBUTE_WEIGHTS[position];
  const weightedSum = ATTRIBUTES.reduce(
    (sum, attribute) => sum + attributes[attribute] * weights[attribute],
    0,
  );
  return Math.round(weightedSum / WEIGHT_TOTAL);
}
