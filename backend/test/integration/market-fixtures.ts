import { Clock } from '../../src/common/time/clock';
import { formatBrasiliaDateTime } from '../../src/common/time/brasilia-time';
import { PrismaService } from '../../src/prisma/prisma.service';

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

// O momento da compra do exemplo 2.3.1: 2026-11-02, 10:15 em Brasília.
export const PURCHASE_TIME = new Date('2026-11-02T13:15:00.000Z');

// Relógio dos testes: o "agora" de cada operação é o que o teste definir.
export class FixedClock extends Clock {
  current = PURCHASE_TIME;

  now(): Date {
    return this.current;
  }
}

export interface PlayerFields {
  name?: string;
  position?: string;
  baseValue: string;
  condition?: string;
  agility?: number;
  age?: number;
  clubId?: number | null;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
}

export function after(ms: number, from = PURCHASE_TIME): Date {
  return new Date(from.getTime() + ms);
}

// Texto do loyalty_until no formato da RN01, a partir de um instante sem segundos.
export function loyaltyText(instant: Date): string {
  return `${formatBrasiliaDateTime(instant).slice(0, 16)}-03:00`;
}

export function addClub(
  prisma: PrismaService,
  name: string,
  acronym: string,
  cash = '300.00',
) {
  return prisma.club.create({
    data: { name, normalizedName: name.toLowerCase(), acronym, cash },
  });
}

export function addPlayer(prisma: PrismaService, fields: PlayerFields) {
  const name = fields.name ?? 'Meia Lua';
  return prisma.player.create({
    data: {
      name,
      sortName: name.toLowerCase(),
      position: fields.position ?? 'MEI',
      agility: fields.agility ?? 50,
      age: fields.age ?? 25,
      baseValue: fields.baseValue,
      condition: fields.condition ?? 'APTO',
      clubId: fields.clubId ?? null,
      pace: 50,
      shooting: fields.shooting ?? 50,
      passing: fields.passing ?? 50,
      dribbling: fields.dribbling ?? 50,
      defending: fields.defending ?? 50,
      physical: 50,
      potential: 80,
    },
  });
}
