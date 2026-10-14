import Decimal from 'decimal.js';
import { Money, money, roundMoney } from '../../../common/money/money';
import { MINIMUM_PLAYER_VALUE, YOUNG_TALENT_MAX_AGE } from './player-value';
import { Condition } from './player.types';

// RN02: desconto por condição física, em %.
const CONDITION_DISCOUNT: Record<Condition, number> = {
  APTO: 0,
  MAL_CONDICIONADO: 15,
  DOENTE: 30,
};

// RN03: a agilidade só altera o desconto de quem não está APTO.
const HIGH_AGILITY_MIN = 80;
const LOW_AGILITY_MAX = 30;
const LOW_AGILITY_EXTRA_DISCOUNT = 10;

// RN04: ajuste por idade, em %.
const YOUNG_TALENT_BONUS = 10;
const VETERAN_MIN_AGE = 32;
const VETERAN_PENALTY = -10;

// RN05: teto do desconto.
const LOWEST_TOTAL_PERCENTAGE = money(-40);

export interface MarketValueInput {
  baseValue: Money;
  condition: Condition;
  agility: number;
  age: number;
}

export function calculateMarketValue({
  baseValue,
  condition,
  agility,
  age,
}: MarketValueInput): Money {
  const totalPercentage = Decimal.max(
    money(ageAdjustment(age)).minus(conditionDiscount(condition, agility)),
    LOWEST_TOTAL_PERCENTAGE,
  );
  const value = baseValue.times(totalPercentage.plus(100)).dividedBy(100);
  return Decimal.max(roundMoney(value), MINIMUM_PLAYER_VALUE);
}

function conditionDiscount(condition: Condition, agility: number): Decimal {
  const discount = money(CONDITION_DISCOUNT[condition]);
  if (condition === 'APTO') {
    return discount;
  }
  if (agility >= HIGH_AGILITY_MIN) {
    return discount.dividedBy(2);
  }
  if (agility <= LOW_AGILITY_MAX) {
    return discount.plus(LOW_AGILITY_EXTRA_DISCOUNT);
  }
  return discount;
}

function ageAdjustment(age: number): number {
  if (age <= YOUNG_TALENT_MAX_AGE) {
    return YOUNG_TALENT_BONUS;
  }
  if (age >= VETERAN_MIN_AGE) {
    return VETERAN_PENALTY;
  }
  return 0;
}
