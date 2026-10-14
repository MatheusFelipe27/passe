import {
  clearDatabase,
  createTestPrisma,
} from '../../../test/integration/test-database';
import { money } from '../../common/money/money';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateMarketValue } from './domain/market-value';
import { CONDITIONS, Condition } from './domain/player.types';
import { marketValueSql } from './market-value.sql';

const BASE_VALUES = [
  '1.00',
  '1.11',
  '1.12',
  '1.66',
  '1.67',
  '1.68',
  '9.50',
  '9.53',
  '9.54',
  '30.01',
  '40.00',
  '46.00',
  '82.00',
  '184.00',
  '290.72',
];
const AGILITIES = [1, 30, 31, 79, 80, 100];
const AGES = [16, 21, 22, 31, 32, 45];

interface Combination {
  baseValue: string;
  condition: Condition;
  agility: number;
  age: number;
}

const combinations: Combination[] = BASE_VALUES.flatMap((baseValue) =>
  CONDITIONS.flatMap((condition) =>
    AGILITIES.flatMap((agility) =>
      AGES.map((age) => ({ baseValue, condition, agility, age })),
    ),
  ),
);

describe('marketValueSql', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = createTestPrisma();
    await prisma.$connect();
    await clearDatabase(prisma);
    await prisma.player.createMany({
      data: combinations.map((combination) => ({
        name: 'Jogador Teste',
        sortName: 'jogador teste',
        position: 'MEI',
        agility: combination.agility,
        age: combination.age,
        baseValue: combination.baseValue,
        condition: combination.condition,
        pace: 50,
        shooting: 50,
        passing: 50,
        dribbling: 50,
        defending: 50,
        physical: 50,
        potential: 50,
      })),
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it(`calcula o mesmo valor que calculateMarketValue nas ${combinations.length} combinações`, async () => {
    const rows = await prisma.$queryRaw<{ id: number; value: string }[]>`
      SELECT j.id, (${marketValueSql})::text AS value FROM jogadores j ORDER BY j.id`;

    const divergences = rows.flatMap((row) => {
      const combination = combinations[row.id - 1];
      const expected = calculateMarketValue({
        ...combination,
        baseValue: money(combination.baseValue),
      }).toFixed(2);
      return row.value === expected
        ? []
        : [{ ...combination, sql: row.value, expected }];
    });

    expect(rows).toHaveLength(combinations.length);
    expect(divergences).toEqual([]);
  });
});
