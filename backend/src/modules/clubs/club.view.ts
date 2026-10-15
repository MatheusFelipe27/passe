import { money } from '../../common/money/money';
import { formatBrasiliaDateTime } from '../../common/time/brasilia-time';
import { Club, Player } from '../../generated/prisma/client';
import {
  calculatePenaltyRate,
  calculateRemainingDays,
} from '../market/domain/loyalty-penalty';
import { compareRosterOrder } from '../players/domain/roster-order';
import { PlayerView, toPlayerView } from '../players/player.view';
import type { RosterPlayer } from './clubs.repository';
import { calculateNetWorth, calculateSquadValue } from './domain/club-values';

export interface ClubView {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

export interface ContractView {
  purchase_value: number;
  loyalty_until: string;
  remaining_days: number;
  penalty_rate: number;
}

export interface RosterPlayerView extends PlayerView {
  contract: ContractView | null;
}

export interface ClubDetailView extends ClubView {
  players: RosterPlayerView[];
}

// Valor do elenco e patrimônio calculados a cada consulta (RN11), pelos valores de mercado atuais.
export function toClubView(club: Club, players: Player[]): ClubView {
  return summarize(club, players.map(toPlayerView));
}

export function toClubDetailView(
  club: Club,
  players: RosterPlayer[],
  now: Date,
): ClubDetailView {
  const roster = [...players]
    .map((player) => ({
      ...toPlayerView(player),
      contract: toContractView(player, now),
    }))
    .sort((a, b) => compareRosterOrder(a, b));
  return { ...summarize(club, roster), players: roster };
}

function summarize(club: Club, players: PlayerView[]): ClubView {
  const cash = money(club.cash.toString());
  const squadValue = calculateSquadValue(
    players.map((player) => money(player.market_value)),
  );
  return {
    id: club.id,
    name: club.name,
    acronym: club.acronym,
    cash: cash.toNumber(),
    squad_value: squadValue.toNumber(),
    net_worth: calculateNetWorth(cash, squadValue).toNumber(),
  };
}

// RN11: o contrato de cada jogador mostra os dias restantes e a multa se fosse vendido agora (RN15).
function toContractView(player: RosterPlayer, now: Date): ContractView | null {
  const [contract] = player.contracts;
  if (!contract) {
    return null;
  }
  const remainingDays = calculateRemainingDays(contract.loyaltyUntil, now);
  return {
    purchase_value: money(contract.purchaseValue.toString()).toNumber(),
    loyalty_until: formatBrasiliaDateTime(contract.loyaltyUntil),
    remaining_days: remainingDays,
    penalty_rate: calculatePenaltyRate(remainingDays),
  };
}
