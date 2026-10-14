import Decimal from 'decimal.js';
import { Money, money, roundMoney } from '../../../common/money/money';
import { MINIMUM_PLAYER_VALUE, YOUNG_TALENT_MAX_AGE } from './player-value';

interface OverallTier {
  from: number;
  to: number;
  valuePerPoint: Decimal;
}

// RN06: faixas progressivas; overall até 40 não soma nada.
const OVERALL_TIERS: OverallTier[] = [
  { from: 41, to: 60, valuePerPoint: money('0.50') },
  { from: 61, to: 75, valuePerPoint: money('2.00') },
  { from: 76, to: 99, valuePerPoint: money('6.00') },
];

export interface BaseValueInput {
  overall: number;
  potential: number;
  age: number;
}

export function calculateBaseValue({
  overall,
  potential,
  age,
}: BaseValueInput): Money {
  const overallPart = calculateOverallPart(overall);
  const value =
    age <= YOUNG_TALENT_MAX_AGE
      ? overallPart.times(100 + potential - overall).dividedBy(100)
      : overallPart;
  return Decimal.max(roundMoney(value), MINIMUM_PLAYER_VALUE);
}

function calculateOverallPart(overall: number): Decimal {
  return OVERALL_TIERS.reduce((total, tier) => {
    const pointsInTier = Math.max(
      0,
      Math.min(overall, tier.to) - tier.from + 1,
    );
    return total.plus(tier.valuePerPoint.times(pointsInTier));
  }, money(0));
}
