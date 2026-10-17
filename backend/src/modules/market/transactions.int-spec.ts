import { NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  clearDatabase,
  createTestPrisma,
} from '../../../test/integration/test-database';
import {
  addClub,
  addPlayer,
  after,
  DAY,
  FixedClock,
  loyaltyText,
} from '../../../test/integration/market-fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionRunner } from '../../prisma/transaction-runner';
import { ClubsRepository } from '../clubs/clubs.repository';
import { LineupsRepository } from '../lineups/lineups.repository';
import { PlayersRepository } from '../players/players.repository';
import { PlayersService } from '../players/players.service';
import { buyPlayerSchema } from './dto/buy-player.schema';
import { listTransactionsQuerySchema } from './dto/list-transactions.query';
import { MarketRepository } from './market.repository';
import { MarketService } from './market.service';
import { TransactionsService } from './transactions.service';

const HEADER =
  'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa';

// O momento da venda do exemplo 2.3.2: 2026-11-05, 16:40 em Brasília.
const SALE_TIME = new Date('2026-11-05T19:40:00.000Z');

describe('histórico de transações no banco', () => {
  let prisma: PrismaService;
  let clock: FixedClock;
  let market: MarketService;
  let history: TransactionsService;
  let players: PlayersService;

  function query(params: Record<string, string> = {}) {
    return listTransactionsQuerySchema.parse(params);
  }

  function buy(
    playerId: number,
    clubId: number,
    loyaltyUntil = after(120 * DAY),
  ) {
    return market.buy(
      playerId,
      buyPlayerSchema.parse({
        club_id: clubId,
        loyalty_until: loyaltyText(loyaltyUntil),
      }),
    );
  }

  // A compra e a venda do Meia Lua nos exemplos 2.3.1 e 2.3.2.
  async function meiaLuaExample() {
    const club = await addClub(prisma, 'Águias FC', 'AGU');
    const player = await addPlayer(prisma, {
      baseValue: '40.00',
      condition: 'MAL_CONDICIONADO',
      agility: 85,
    });
    await buy(player.id, club.id, new Date('2027-03-02T13:15:00.000Z'));
    await prisma.player.update({
      where: { id: player.id },
      data: { condition: 'APTO' },
    });
    clock.current = SALE_TIME;
    await market.sell(player.id);
    return { club, player };
  }

  beforeAll(async () => {
    prisma = createTestPrisma();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    clock = new FixedClock();
    const repository = new MarketRepository(prisma);
    const playersRepository = new PlayersRepository(prisma);
    const lineups = new LineupsRepository(prisma);
    const transactions = new TransactionRunner(prisma);
    market = new MarketService(
      repository,
      new ClubsRepository(prisma),
      playersRepository,
      lineups,
      transactions,
      clock,
    );
    history = new TransactionsService(repository, playersRepository);
    players = new PlayersService(
      playersRepository,
      lineups,
      new ClubsRepository(prisma),
      transactions,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('consulta (RN17)', () => {
    it('reproduz o exemplo 2.3.3 com type=VENDA', async () => {
      const { club, player } = await meiaLuaExample();

      const result = await history.history(club.id, query({ type: 'VENDA' }));

      expect(result).toEqual({
        data: [
          {
            id: 2,
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
          },
        ],
        summary: {
          total_spent: 0,
          total_received: 35.7,
          total_fees: 0.3,
          total_penalties: 4,
          total_profit: 3,
        },
      });
    });

    it('sem filtro, traz a compra depois da venda e o summary da observação 2.3.3', async () => {
      const { club } = await meiaLuaExample();

      const result = await history.history(club.id, query());

      expect(result.data.map((item) => [item.type, item.created_at])).toEqual([
        ['VENDA', '2026-11-05T16:40:00-03:00'],
        ['COMPRA', '2026-11-02T10:15:00-03:00'],
      ]);
      expect(result.data[1]).toMatchObject({
        value: 37,
        fee: 1.85,
        penalty: 0,
        profit: null,
        cash_change: -38.85,
      });
      expect(result.summary).toEqual({
        total_spent: 38.85,
        total_received: 35.7,
        total_fees: 2.15,
        total_penalties: 4,
        total_profit: 3,
      });
      expect(
        await history.history(club.id, query({ type: 'COMPRA,VENDA' })),
      ).toEqual(result);
    });

    it('no empate de data e hora, ordena pelo id decrescente', async () => {
      const club = await addClub(prisma, 'Águias FC', 'AGU', '1000.00');
      const first = await addPlayer(prisma, {
        name: 'Primeiro Jogador',
        baseValue: '10.00',
      });
      const second = await addPlayer(prisma, {
        name: 'Segundo Jogador',
        baseValue: '10.00',
      });
      const third = await addPlayer(prisma, {
        name: 'Terceiro Jogador',
        baseValue: '10.00',
      });
      await buy(first.id, club.id);
      await buy(second.id, club.id);
      clock.current = after(DAY);
      await buy(third.id, club.id, after(120 * DAY));

      const result = await history.history(club.id, query());

      expect(result.data.map((item) => item.player_name)).toEqual([
        'Terceiro Jogador',
        'Segundo Jogador',
        'Primeiro Jogador',
      ]);
    });

    it('guarda o nome e os valores do momento, mesmo depois de editar o jogador', async () => {
      const club = await addClub(prisma, 'Águias FC', 'AGU');
      const player = await addPlayer(prisma, {
        name: 'Nome Antigo',
        baseValue: '40.00',
      });
      await buy(player.id, club.id);
      await players.update(player.id, {
        name: 'Nome Novo',
        position: 'MEI',
        agility: 50,
        age: 32,
      });

      const result = await history.history(club.id, query());

      expect(result.data[0]).toMatchObject({
        player_name: 'Nome Antigo',
        value: 40,
        fee: 2,
      });
    });

    it('mantém as transações de jogador excluído e recusa o filtro por ele com 404', async () => {
      const club = await addClub(prisma, 'Águias FC', 'AGU');
      const player = await addPlayer(prisma, {
        name: 'Jogador Saiu',
        baseValue: '20.00',
      });
      await buy(player.id, club.id);
      await market.sell(player.id);
      await players.remove(player.id);

      const result = await history.history(club.id, query());

      expect(result.data.map((item) => [item.type, item.player_name])).toEqual([
        ['VENDA', 'Jogador Saiu'],
        ['COMPRA', 'Jogador Saiu'],
      ]);
      await expect(
        history.history(club.id, query({ player_id: String(player.id) })),
      ).rejects.toThrow(new NotFoundException('Jogador não encontrado.'));
      await expect(
        history.exportCsv(club.id, query({ player_id: String(player.id) })),
      ).rejects.toThrow(NotFoundException);
    });

    it('fecha a conta: 300,00 + soma das variações = caixa atual', async () => {
      const club = await addClub(prisma, 'Águias FC', 'AGU');
      const cheap = await addPlayer(prisma, {
        name: 'Barato Um',
        baseValue: '25.00',
      });
      const pricey = await addPlayer(prisma, {
        name: 'Caro Dois',
        baseValue: '75.00',
        condition: 'DOENTE',
      });
      await buy(cheap.id, club.id, after(10 * DAY));
      await buy(pricey.id, club.id, after(200 * DAY));
      await prisma.player.update({
        where: { id: pricey.id },
        data: { condition: 'APTO' },
      });
      clock.current = after(5 * DAY);
      await market.sell(pricey.id);
      clock.current = after(30 * DAY);
      await market.sell(cheap.id);

      const result = await history.history(club.id, query());
      const stored = await prisma.club.findUniqueOrThrow({
        where: { id: club.id },
      });

      const total = result.data.reduce(
        (sum, item) => sum.plus(item.cash_change),
        new Decimal('300.00'),
      );
      expect(result.data).toHaveLength(4);
      expect(total.toFixed(2)).toBe(stored.cash.toFixed(2));
    });

    it('combina os filtros, e o summary respeita os dois', async () => {
      const club = await addClub(prisma, 'Águias FC', 'AGU');
      const kept = await addPlayer(prisma, {
        name: 'Fica Aqui',
        baseValue: '40.00',
      });
      const other = await addPlayer(prisma, {
        name: 'Outro Jogador',
        baseValue: '20.00',
      });
      await buy(kept.id, club.id);
      await buy(other.id, club.id);
      clock.current = after(DAY);
      await market.sell(kept.id);
      await market.sell(other.id);

      const purchases = await history.history(
        club.id,
        query({ type: 'COMPRA', player_id: String(kept.id) }),
      );
      const allOfKept = await history.history(
        club.id,
        query({ player_id: String(kept.id) }),
      );

      expect(
        purchases.data.map((item) => [item.type, item.player_name]),
      ).toEqual([['COMPRA', 'Fica Aqui']]);
      expect(purchases.summary).toEqual({
        total_spent: 42,
        total_received: 0,
        total_fees: 2,
        total_penalties: 0,
        total_profit: 0,
      });
      expect(allOfKept.data).toHaveLength(2);
      expect(allOfKept.data.every((item) => item.player_id === kept.id)).toBe(
        true,
      );
    });

    it('não mostra as transações de outro clube', async () => {
      const club = await addClub(prisma, 'Águias FC', 'AGU');
      const rival = await addClub(prisma, 'Delta FC', 'DFC');
      const player = await addPlayer(prisma, { baseValue: '20.00' });
      await buy(player.id, rival.id);

      const result = await history.history(club.id, query());

      expect(result.data).toEqual([]);
    });

    it('com jogador sem transações no clube, responde lista vazia e summary zerado', async () => {
      const club = await addClub(prisma, 'Águias FC', 'AGU');
      const player = await addPlayer(prisma, { baseValue: '20.00' });

      const result = await history.history(
        club.id,
        query({ player_id: String(player.id) }),
      );

      expect(result).toEqual({
        data: [],
        summary: {
          total_spent: 0,
          total_received: 0,
          total_fees: 0,
          total_penalties: 0,
          total_profit: 0,
        },
      });
    });

    it('recusa com 404 o clube inexistente e o jogador inexistente', async () => {
      const club = await addClub(prisma, 'Águias FC', 'AGU');

      await expect(history.history(999, query())).rejects.toThrow(
        new NotFoundException('Clube não encontrado.'),
      );
      await expect(history.exportCsv(999, query())).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        history.history(club.id, query({ player_id: '999' })),
      ).rejects.toThrow(new NotFoundException('Jogador não encontrado.'));
    });
  });

  describe('exportação CSV (RN18)', () => {
    it('reproduz o exemplo da RN18 e nomeia o arquivo pela sigla', async () => {
      const { club } = await meiaLuaExample();

      const file = await history.exportCsv(club.id, query());

      expect(file.fileName).toBe('transacoes-AGU.csv');
      expect(file.content).toBe(
        `${HEADER}\n` +
          '2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70\n' +
          '2026-11-02T10:15:00-03:00;COMPRA;Meia Lua;37,00;1,85;0,00;;-38,85\n',
      );
    });

    it('aplica os filtros, como no exemplo 2.3.4', async () => {
      const { club } = await meiaLuaExample();

      const file = await history.exportCsv(club.id, query({ type: 'VENDA' }));

      expect(file.content).toBe(
        `${HEADER}\n` +
          '2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70\n',
      );
    });

    it('sem transações, traz só o cabeçalho', async () => {
      const club = await addClub(prisma, 'Águias FC', 'AGU');

      expect((await history.exportCsv(club.id, query())).content).toBe(
        `${HEADER}\n`,
      );
    });

    it('põe entre aspas o nome gravado com aspas', async () => {
      const club = await addClub(prisma, 'Águias FC', 'AGU');
      const player = await addPlayer(prisma, {
        name: 'Zé "Foguete" Lima',
        baseValue: '20.00',
      });
      await buy(player.id, club.id);

      const file = await history.exportCsv(club.id, query());

      expect(file.content.split('\n')[1]).toBe(
        '2026-11-02T10:15:00-03:00;COMPRA;"Zé ""Foguete"" Lima";20,00;0,00;0,00;;-20,00',
      );
    });
  });
});
