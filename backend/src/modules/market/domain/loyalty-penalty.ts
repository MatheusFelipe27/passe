import { DAY_MS } from '../../../common/time/brasilia-time';

interface PenaltyBand {
  maxDays: number;
  rate: number;
}

// RN15: percentual da multa pelos dias restantes de fidelidade.
const PENALTY_BANDS: PenaltyBand[] = [
  { maxDays: 0, rate: 0 },
  { maxDays: 30, rate: 5 },
  { maxDays: 180, rate: 10 },
];
const LONGEST_PENALTY_RATE = 20;

// RN15: dias com fração até o fim da fidelidade, arredondados para cima; 0 se já passou.
export function calculateRemainingDays(loyaltyUntil: Date, now: Date): number {
  const remainingMs = loyaltyUntil.getTime() - now.getTime();
  return remainingMs <= 0 ? 0 : Math.ceil(remainingMs / DAY_MS);
}

export function calculatePenaltyRate(remainingDays: number): number {
  const band = PENALTY_BANDS.find((item) => remainingDays <= item.maxDays);
  return band?.rate ?? LONGEST_PENALTY_RATE;
}
