import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  clearDatabase,
  createTestPrisma,
} from '../../../test/integration/test-database';
import {
  addClub as insertClub,
  addPlayer as insertPlayer,
  after,
  DAY,
  FixedClock,
  HOUR,
  loyaltyText,
  MINUTE,
  PlayerFields,
  PURCHASE_TIME,
} from '../../../test/integration/market-fixtures';
import { formatBrasiliaDateTime } from '../../common/time/brasilia-time';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionRunner } from '../../prisma/transaction-runner';
import { ClubsRepository } from '../clubs/clubs.repository';
import { ClubsService } from '../clubs/clubs.service';
import { LineupsRepository } from '../lineups/lineups.repository';
import { PlayersRepository } from '../players/players.repository';
import { buyPlayerSchema } from './dto/buy-player.schema';
import { MarketRepository } from './market.repository';
import { MarketService } from './market.service';

describe('mercado no banco', () => {
  let prisma: PrismaService;
  let clock: FixedClock;
  let marketRepository: MarketRepository;
  let market: MarketService;
  let clubs: ClubsService;

  function addClub(name: string, acronym: string, cash = '300.00') {
    return insertClub(prisma, name, acronym, cash);
  }

  function addPlayer(fields: PlayerFields) {
    return insertPlayer(prisma, fields);
  }

  function buy(playerId: number, clubId: number, loyaltyUntil: Date) {
    return market.buy(
      playerId,
      buyPlayerSchema.parse({
        club_id: clubId,
        loyalty_until: loyaltyText(loyaltyUntil),
      }),
    );
  }

  async function cashOf(clubId: number): Promise<string> {
    const club = await prisma.club.findUniqueOrThrow({ where: { id: clubId } });
    return club.cash.toFixed(2);
  }

  async function marketRows() {
    return {
      contracts: await prisma.contract.count(),
      transactions: await prisma.transaction.count(),
    };
  }

  beforeAll(async () => {
    prisma = createTestPrisma();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    clock = new FixedClock();
    marketRepository = new MarketRepository(prisma);
    const transactions = new TransactionRunner(prisma);
    market = new MarketService(
      marketRepository,
      new ClubsRepository(prisma),
      new PlayersRepository(prisma),
      new LineupsRepository(prisma),
      transactions,
      clock,
    );
    clubs = new ClubsService(new ClubsRepository(prisma), transactions, clock);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('compra (RN12 e RN13)', () => {
    it('reproduz o exemplo 2.3.1: valor 37,00, taxa 1,85 e caixa 261,15', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const player = await addPlayer({
        baseValue: '40.00',
        condition: 'MAL_CONDICIONADO',
        agility: 85,
      });

      const purchase = await buy(
        player.id,
        club.id,
        new Date('2027-03-02T13:15:00.000Z'),
      );

      expect(purchase).toEqual({
        id: purchase.id,
        club_id: club.id,
        player_id: player.id,
        player_name: 'Meia Lua',
        type: 'COMPRA',
        value: 37,
        fee: 1.85,
        penalty: 0,
        profit: null,
        cash_change: -38.85,
        created_at: '2026-11-02T10:15:00-03:00',
        contract: {
          purchase_value: 37,
          loyalty_until: '2027-03-02T10:15:00-03:00',
          status: 'ATIVO',
        },
        club_cash: 261.15,
      });
      expect(await cashOf(club.id)).toBe('261.15');
      expect(
        (await prisma.player.findUniqueOrThrow({ where: { id: player.id } }))
          .clubId,
      ).toBe(club.id);
      const contract = await prisma.contract.findFirstOrThrow();
      expect(contract).toMatchObject({
        playerId: player.id,
        clubId: club.id,
        status: 'ATIVO',
        startedAt: PURCHASE_TIME,
        endedAt: null,
      });
      expect(contract.purchaseValue.toFixed(2)).toBe('37.00');
      const transaction = await prisma.transaction.findFirstOrThrow();
      expect(transaction).toMatchObject({
        type: 'COMPRA',
        playerName: 'Meia Lua',
        createdAt: PURCHASE_TIME,
        profit: null,
      });
      expect(transaction.cashChange.toFixed(2)).toBe('-38.85');
    });

    it.each([
      ['28.00', '0.00', '28.00', '272.00'],
      ['30.00', '0.00', '30.00', '270.00'],
      ['30.01', '1.50', '31.51', '268.49'],
    ])(
      'cobra a taxa só acima de 30,00: valor %s, taxa %s, custo %s',
      async (value, fee, cost, cash) => {
        const club = await addClub('Águias FC', 'AGU');
        const player = await addPlayer({ baseValue: value });

        const purchase = await buy(player.id, club.id, after(30 * DAY));

        expect([purchase.value, purchase.fee, purchase.cash_change]).toEqual([
          Number(value),
          Number(fee),
          -Number(cost),
        ]);
        expect(await cashOf(club.id)).toBe(cash);
      },
    );

    it.each([
      ['100.00', '47.62', true],
      ['100.00', '48.00', false],
      ['261.15', '124.35', true],
      ['261.15', '124.36', false],
    ])(
      'com caixa %s, compra de valor %s aceita = %s (limite de 50%% sem arredondar)',
      async (cash, value, accepted) => {
        const club = await addClub('Águias FC', 'AGU', cash);
        const player = await addPlayer({ baseValue: value });

        const attempt = buy(player.id, club.id, after(30 * DAY));

        if (accepted) {
          await expect(attempt).resolves.toBeDefined();
          return;
        }
        await expect(attempt).rejects.toThrow(ConflictException);
        expect(await cashOf(club.id)).toBe(cash);
        expect(await marketRows()).toEqual({ contracts: 0, transactions: 0 });
      },
    );

    it('usa o valor de mercado do momento, e não o valor base', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const player = await addPlayer({
        baseValue: '40.00',
        condition: 'DOENTE',
        agility: 20,
        age: 34,
      });

      const purchase = await buy(player.id, club.id, after(30 * DAY));

      expect(purchase.value).toBe(24);
      expect(purchase.contract.purchase_value).toBe(24);
    });
  });

  describe('fim da fidelidade (RN01)', () => {
    it.each([
      ['1 minuto depois da compra', true, after(MINUTE)],
      ['exatamente 1.095 dias depois', true, after(1095 * DAY)],
      ['1.095 dias e 1 minuto depois', false, after(1095 * DAY + MINUTE)],
      ['no próprio momento da compra', false, PURCHASE_TIME],
      ['1 minuto antes da compra', false, after(-MINUTE)],
    ])('%s → aceito = %s', async (_, accepted, loyaltyUntil) => {
      const club = await addClub('Águias FC', 'AGU');
      const player = await addPlayer({ baseValue: '20.00' });

      const attempt = buy(player.id, club.id, loyaltyUntil);

      if (accepted) {
        await expect(attempt).resolves.toMatchObject({
          contract: { loyalty_until: formatBrasiliaDateTime(loyaltyUntil) },
        });
        return;
      }
      await expect(attempt).rejects.toThrow(
        new BadRequestException(
          'loyalty_until: deve ser depois do momento da compra e até 1095 dias depois dele',
        ),
      );
      expect(await marketRows()).toEqual({ contracts: 0, transactions: 0 });
    });

    it('confere a janela da fidelidade antes do jogador e do clube', async () => {
      await expect(buy(999, 999, after(-MINUTE))).rejects.toThrow(
        BadRequestException,
      );
    });

    it('vale o instante exato do servidor, com segundos', async () => {
      clock.current = new Date('2026-11-02T13:15:30.000Z');
      const club = await addClub('Águias FC', 'AGU');
      const player = await addPlayer({ baseValue: '20.00' });

      await expect(
        buy(player.id, club.id, new Date('2026-11-02T13:15:00.000Z')),
      ).rejects.toThrow(BadRequestException);
      await expect(
        buy(player.id, club.id, new Date('2026-11-02T13:16:00.000Z')),
      ).resolves.toBeDefined();
    });
  });

  describe('compra recusada (RN09, RN12 e RN14)', () => {
    it('recusa jogador que já tem clube', async () => {
      const first = await addClub('Águias FC', 'AGU');
      const second = await addClub('Delta FC', 'DFC');
      const player = await addPlayer({ baseValue: '20.00' });
      await buy(player.id, first.id, after(30 * DAY));

      await expect(buy(player.id, second.id, after(30 * DAY))).rejects.toThrow(
        new ConflictException(
          'O jogador já tem clube: só jogador livre pode ser comprado.',
        ),
      );
      expect(await cashOf(second.id)).toBe('300.00');
    });

    it('recusa jogador excluído e jogador inexistente com 404', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const player = await addPlayer({ baseValue: '20.00' });
      await prisma.player.update({
        where: { id: player.id },
        data: { deletedAt: PURCHASE_TIME },
      });

      await expect(buy(player.id, club.id, after(30 * DAY))).rejects.toThrow(
        new NotFoundException('Jogador não encontrado.'),
      );
      await expect(buy(999, club.id, after(30 * DAY))).rejects.toThrow(
        NotFoundException,
      );
    });

    it('recusa clube inexistente com 404', async () => {
      const player = await addPlayer({ baseValue: '20.00' });

      await expect(buy(player.id, 999, after(30 * DAY))).rejects.toThrow(
        new NotFoundException('Clube não encontrado.'),
      );
      expect(await marketRows()).toEqual({ contracts: 0, transactions: 0 });
    });

    it('aceita o 12º jogador e recusa o 13º', async () => {
      const club = await addClub('Águias FC', 'AGU', '1000.00');
      for (let index = 0; index < 11; index++) {
        await addPlayer({
          name: `Titular ${index}`,
          baseValue: '5.00',
          clubId: club.id,
        });
      }
      const twelfth = await addPlayer({ name: 'Doze Doze', baseValue: '5.00' });
      const thirteenth = await addPlayer({
        name: 'Treze Treze',
        baseValue: '5.00',
      });

      await expect(
        buy(twelfth.id, club.id, after(30 * DAY)),
      ).resolves.toBeDefined();
      await expect(
        buy(thirteenth.id, club.id, after(30 * DAY)),
      ).rejects.toThrow(
        new ConflictException(
          'O elenco do Águias FC já tem 12 jogadores, o máximo permitido.',
        ),
      );
      expect(await prisma.player.count({ where: { clubId: club.id } })).toBe(
        12,
      );
    });

    it('não deixa o clube recomprar quem vendeu, mas outro clube pode (B16)', async () => {
      const seller = await addClub('Águias FC', 'AGU');
      const other = await addClub('Delta FC', 'DFC');
      const player = await addPlayer({ baseValue: '20.00' });
      await buy(player.id, seller.id, after(30 * DAY));
      await market.sell(player.id);

      await expect(buy(player.id, seller.id, after(30 * DAY))).rejects.toThrow(
        new ConflictException(
          'O Águias FC já vendeu este jogador e não pode comprá-lo de novo.',
        ),
      );
      await expect(
        buy(player.id, other.id, after(30 * DAY)),
      ).resolves.toMatchObject({ club_id: other.id });
    });

    it('com dois pedidos de compra do mesmo jogador ao mesmo tempo, só um vale', async () => {
      const first = await addClub('Águias FC', 'AGU');
      const second = await addClub('Delta FC', 'DFC');
      const player = await addPlayer({ baseValue: '20.00' });

      const results = await Promise.allSettled([
        buy(player.id, first.id, after(30 * DAY)),
        buy(player.id, second.id, after(30 * DAY)),
      ]);

      expect(results.map((result) => result.status).sort()).toEqual([
        'fulfilled',
        'rejected',
      ]);
      expect(await marketRows()).toEqual({ contracts: 1, transactions: 1 });
      const cashes = [await cashOf(first.id), await cashOf(second.id)].sort();
      expect(cashes).toEqual(['280.00', '300.00']);
    });

    it('desfaz tudo se uma parte da compra falhar', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const player = await addPlayer({ baseValue: '20.00' });
      jest
        .spyOn(marketRepository, 'createTransaction')
        .mockRejectedValueOnce(new Error('falha simulada'));

      await expect(buy(player.id, club.id, after(30 * DAY))).rejects.toThrow(
        'falha simulada',
      );

      expect(await cashOf(club.id)).toBe('300.00');
      expect(
        (await prisma.player.findUniqueOrThrow({ where: { id: player.id } }))
          .clubId,
      ).toBeNull();
      expect(await marketRows()).toEqual({ contracts: 0, transactions: 0 });
    });
  });

  describe('venda (RN15 e RN16)', () => {
    it('reproduz o exemplo 2.3.2: 117 dias, multa 4,00, crédito 35,70 e caixa 296,85', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const player = await addPlayer({
        baseValue: '40.00',
        condition: 'MAL_CONDICIONADO',
        agility: 85,
      });
      await buy(player.id, club.id, new Date('2027-03-02T13:15:00.000Z'));
      await prisma.player.update({
        where: { id: player.id },
        data: { condition: 'APTO' },
      });
      clock.current = new Date('2026-11-05T19:40:00.000Z');

      const sale = await market.sell(player.id);

      expect(sale).toEqual({
        id: sale.id,
        club_id: club.id,
        player_id: player.id,
        player_name: 'Meia Lua',
        type: 'VENDA',
        value: 40,
        fee: 0.3,
        penalty: 4,
        profit: 3,
        cash_change: 35.7,
        created_at: '2026-11-05T16:40:00-03:00',
        purchase_value: 37,
        remaining_days: 117,
        penalty_rate: 10,
        contract_status: 'RESCINDIDO',
        club_cash: 296.85,
      });
      expect(await cashOf(club.id)).toBe('296.85');
      expect(
        (await prisma.player.findUniqueOrThrow({ where: { id: player.id } }))
          .clubId,
      ).toBeNull();
      expect(await prisma.contract.findFirstOrThrow()).toMatchObject({
        status: 'RESCINDIDO',
        endedAt: clock.current,
      });
      expect(await prisma.transaction.count({ where: { type: 'VENDA' } })).toBe(
        1,
      );
    });

    it.each([
      ['10 dias e 2 horas', 10 * DAY + 2 * HOUR, 11, 5, 2],
      ['exatamente 30 dias', 30 * DAY, 30, 5, 2],
      ['30 dias e 1 minuto', 30 * DAY + MINUTE, 31, 10, 4],
      ['exatamente 180 dias', 180 * DAY, 180, 10, 4],
      ['180 dias e 1 minuto', 180 * DAY + MINUTE, 181, 20, 8],
      ['200 dias', 200 * DAY, 200, 20, 8],
    ])(
      'com %s de fidelidade restante: %i dias e %i%% de multa',
      async (_, remaining, days, rate, penalty) => {
        const club = await addClub('Águias FC', 'AGU');
        const player = await addPlayer({ baseValue: '40.00' });
        await buy(player.id, club.id, after(remaining));

        const sale = await market.sell(player.id);

        expect([
          sale.remaining_days,
          sale.penalty_rate,
          sale.penalty,
          sale.contract_status,
        ]).toEqual([days, rate, penalty, 'RESCINDIDO']);
        expect(sale.cash_change).toBe(40 - penalty);
      },
    );

    it.each([
      ['já passou', DAY + MINUTE],
      ['é o próprio momento da venda', DAY],
    ])(
      'encerra o contrato sem multa quando o fim da fidelidade %s',
      async (_, elapsed) => {
        const club = await addClub('Águias FC', 'AGU');
        const player = await addPlayer({ baseValue: '25.00' });
        await buy(player.id, club.id, after(DAY));
        clock.current = after(elapsed);

        const sale = await market.sell(player.id);

        expect(sale).toMatchObject({
          remaining_days: 0,
          penalty_rate: 0,
          penalty: 0,
          profit: 0,
          fee: 0,
          cash_change: 25,
          contract_status: 'ENCERRADO',
          club_cash: 300,
        });
        expect((await prisma.contract.findFirstOrThrow()).status).toBe(
          'ENCERRADO',
        );
      },
    );

    it('limita a multa a 10,00 e cobra a comissão progressiva', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const player = await addPlayer({
        baseValue: '75.00',
        condition: 'DOENTE',
      });
      await buy(player.id, club.id, after(200 * DAY));
      await prisma.player.update({
        where: { id: player.id },
        data: { condition: 'APTO' },
      });

      const sale = await market.sell(player.id);

      expect(sale).toMatchObject({
        purchase_value: 52.5,
        value: 75,
        penalty_rate: 20,
        penalty: 10,
        profit: 22.5,
        fee: 3.5,
        cash_change: 61.5,
        club_cash: 306.37,
      });
    });

    it('vende com prejuízo sem comissão', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const player = await addPlayer({ baseValue: '50.00' });
      await buy(player.id, club.id, after(200 * DAY));
      await prisma.player.update({
        where: { id: player.id },
        data: { condition: 'MAL_CONDICIONADO' },
      });

      const sale = await market.sell(player.id);

      expect(sale).toMatchObject({
        purchase_value: 50,
        value: 42.5,
        penalty: 8.5,
        profit: -7.5,
        fee: 0,
        cash_change: 34,
      });
    });

    it('tira o titular vendido da escalação na mesma operação', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const player = await addPlayer({ baseValue: '20.00' });
      await buy(player.id, club.id, after(30 * DAY));
      await prisma.lineupEntry.create({
        data: { clubId: club.id, playerId: player.id },
      });

      await market.sell(player.id);

      expect(await prisma.lineupEntry.count()).toBe(0);
    });

    it('recusa vender jogador livre (409), excluído ou inexistente (404)', async () => {
      const free = await addPlayer({ baseValue: '20.00' });
      const deleted = await addPlayer({
        name: 'Ex Jogador',
        baseValue: '20.00',
      });
      await prisma.player.update({
        where: { id: deleted.id },
        data: { deletedAt: PURCHASE_TIME },
      });

      await expect(market.sell(free.id)).rejects.toThrow(
        new ConflictException('Jogador livre não pode ser vendido.'),
      );
      await expect(market.sell(deleted.id)).rejects.toThrow(NotFoundException);
      await expect(market.sell(999)).rejects.toThrow(NotFoundException);
      expect(await marketRows()).toEqual({ contracts: 0, transactions: 0 });
    });

    it('desfaz tudo se uma parte da venda falhar', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const player = await addPlayer({ baseValue: '20.00' });
      await buy(player.id, club.id, after(30 * DAY));
      jest
        .spyOn(marketRepository, 'createTransaction')
        .mockRejectedValueOnce(new Error('falha simulada'));

      await expect(market.sell(player.id)).rejects.toThrow('falha simulada');

      expect(await cashOf(club.id)).toBe('280.00');
      expect(
        (await prisma.player.findUniqueOrThrow({ where: { id: player.id } }))
          .clubId,
      ).toBe(club.id);
      expect((await prisma.contract.findFirstOrThrow()).status).toBe('ATIVO');
    });
  });

  describe('sequência de compras conferida pela consulta do clube (B13)', () => {
    it('mostra o caixa, o elenco na ordem e o contrato de cada jogador', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const forward = await addPlayer({
        name: 'Otto Rangel',
        position: 'ATA',
        baseValue: '30.00',
        age: 21,
      });
      const keeper = await addPlayer({
        name: 'Rui Prado',
        position: 'GOL',
        baseValue: '20.00',
        age: 33,
      });
      const back = await addPlayer({
        name: 'Hugo Vaz',
        position: 'ZAG',
        baseValue: '40.00',
        condition: 'MAL_CONDICIONADO',
        agility: 25,
      });

      const purchases = [
        await buy(forward.id, club.id, after(10 * DAY + 2 * HOUR)),
        await buy(keeper.id, club.id, after(200 * DAY)),
        await buy(back.id, club.id, after(45 * DAY)),
      ];

      expect(
        purchases.map((purchase) => [
          purchase.value,
          purchase.fee,
          purchase.club_cash,
        ]),
      ).toEqual([
        [33, 1.65, 265.35],
        [18, 0, 247.35],
        [30, 0, 217.35],
      ]);

      clock.current = after(HOUR);
      const detail = await clubs.findById(club.id);

      expect(
        detail.players.map((player) => [
          player.name,
          player.market_value,
          player.contract?.remaining_days,
          player.contract?.penalty_rate,
        ]),
      ).toEqual([
        ['Rui Prado', 18, 200, 20],
        ['Hugo Vaz', 30, 45, 10],
        ['Otto Rangel', 33, 11, 5],
      ]);
      expect(detail.players[0].contract?.loyalty_until).toBe(
        formatBrasiliaDateTime(after(200 * DAY)),
      );
      expect(detail).toMatchObject({
        cash: 217.35,
        squad_value: 81,
        net_worth: 298.35,
      });
    });
  });
});
