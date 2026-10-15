import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  clearDatabase,
  createTestPrisma,
} from '../../../test/integration/test-database';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionRunner } from '../../prisma/transaction-runner';
import { ClubsRepository } from './clubs.repository';
import { ClubsService } from './clubs.service';
import { createClubSchema } from './dto/create-club.schema';
import { listClubsQuerySchema } from './dto/list-clubs.query';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

const GREEK_CLUBS: [string, string][] = [
  ['Clube Alfa', 'CAL'],
  ['Clube Beta', 'CBE'],
  ['Clube Gama', 'CGA'],
  ['Clube Delta', 'CDE'],
  ['Clube Epsilon', 'CEP'],
  ['Clube Zeta', 'CZE'],
  ['Clube Eta', 'CET'],
  ['Clube Teta', 'CTE'],
  ['Clube Iota', 'CIO'],
  ['Clube Kapa', 'CKA'],
  ['Clube Lambda', 'CLA'],
  ['Clube Mi', 'CMI'],
  ['Clube Ni', 'CNI'],
  ['Clube Xi', 'CXI'],
  ['Clube Omicron', 'COM'],
  ['Clube Pi', 'CPI'],
  ['Clube Ro', 'CRO'],
  ['Clube Sigma', 'CSI'],
  ['Clube Tau', 'CTA'],
  ['Clube Upsilon', 'CUP'],
];

describe('clubes no banco', () => {
  let prisma: PrismaService;
  let service: ClubsService;

  function create(name: string, acronym: string) {
    return service.create(createClubSchema.parse({ name, acronym }));
  }

  async function addPlayer(
    clubId: number | null,
    fields: { name: string; position: string; baseValue: string },
  ) {
    return prisma.player.create({
      data: {
        name: fields.name,
        sortName: fields.name.toLowerCase(),
        position: fields.position,
        agility: 50,
        age: 25,
        baseValue: fields.baseValue,
        clubId,
        pace: 50,
        shooting: 50,
        passing: 50,
        dribbling: 50,
        defending: 50,
        physical: 50,
        potential: 50,
      },
    });
  }

  async function addContract(
    playerId: number,
    clubId: number,
    loyaltyUntil: Date,
    status = 'ATIVO',
  ) {
    await prisma.contract.create({
      data: {
        playerId,
        clubId,
        purchaseValue: '37.00',
        loyaltyUntil,
        status,
      },
    });
  }

  beforeAll(async () => {
    prisma = createTestPrisma();
    await prisma.$connect();
    service = new ClubsService(
      new ClubsRepository(prisma),
      new TransactionRunner(prisma),
    );
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('criação (RN10)', () => {
    it('nasce com 300,00 em caixa, sem jogadores', async () => {
      const club = await create('  Águias   FC ', 'AGU');

      expect(club).toEqual({
        id: club.id,
        name: 'Águias FC',
        acronym: 'AGU',
        cash: 300,
        squad_value: 0,
        net_worth: 300,
      });
      const stored = await prisma.club.findUniqueOrThrow({
        where: { id: club.id },
      });
      expect(stored.normalizedName).toBe('águias fc');
      expect(stored.cash.toFixed(2)).toBe('300.00');
    });

    it('recusa o nome repetido sem diferenciar maiúsculas, mas aceita sem acento', async () => {
      await create('Águias FC', 'AGU');

      await expect(create('  águias   fc ', 'ASC')).rejects.toThrow(
        ConflictException,
      );
      await expect(create('Aguias FC', 'AGI')).resolves.toMatchObject({
        name: 'Aguias FC',
      });
      expect(await prisma.club.count()).toBe(2);
    });

    it('recusa a sigla repetida', async () => {
      await create('Águias FC', 'AGU');

      await expect(create('Águia Gaúcha', 'AGU')).rejects.toThrow(
        ConflictException,
      );
      expect(await prisma.club.count()).toBe(1);
    });

    it('aceita o 20º clube e recusa o 21º', async () => {
      for (const [name, acronym] of GREEK_CLUBS.slice(0, 19)) {
        await create(name, acronym);
      }

      await expect(create(...GREEK_CLUBS[19])).resolves.toBeDefined();
      await expect(create('Águias FC', 'AGU')).rejects.toThrow(
        ConflictException,
      );
      expect(await prisma.club.count()).toBe(20);
    });

    it('cria um só clube quando dois pedidos iguais chegam juntos', async () => {
      const results = await Promise.allSettled([
        create('Delta FC', 'DFC'),
        create('Delta FC', 'DEF'),
      ]);

      expect(results.map((result) => result.status).sort()).toEqual([
        'fulfilled',
        'rejected',
      ]);
      expect(await prisma.club.count()).toBe(1);
    });
  });

  describe('restrições no banco (B3)', () => {
    async function insertClub(name: string, key: string, acronym: string) {
      await prisma.$executeRaw`
        INSERT INTO clubes (nome, nome_normalizado, sigla)
        VALUES (${name}, ${key}, ${acronym})`;
    }

    it('recusa "águias fc" com "Águias FC" cadastrado e aceita "Aguias FC"', async () => {
      await create('Águias FC', 'AGU');

      await expect(
        insertClub('águias fc', 'águias fc', 'AGF'),
      ).rejects.toThrow();
      await expect(
        insertClub('Aguias FC', 'aguias fc', 'AGI'),
      ).resolves.toBeUndefined();
    });

    it('recusa duas siglas iguais', async () => {
      await create('Águias FC', 'AGU');

      await expect(
        insertClub('Gaviões do Litoral', 'gaviões do litoral', 'AGU'),
      ).rejects.toThrow();
    });

    it('recusa o mesmo jogador em duas escalações', async () => {
      const first = await create('Águias FC', 'AGU');
      const second = await create('Delta FC', 'DFC');
      const player = await addPlayer(first.id, {
        name: 'Rui Prado',
        position: 'GOL',
        baseValue: '20.00',
      });
      await prisma.lineupEntry.create({
        data: { clubId: first.id, playerId: player.id },
      });

      await expect(
        prisma.lineupEntry.create({
          data: { clubId: second.id, playerId: player.id },
        }),
      ).rejects.toThrow();
    });
  });

  describe('listagem (RN11)', () => {
    it('ordena pelo nome e pelo patrimônio, com desempate pelo nome e pelo id', async () => {
      const gama = await create('Gama SC', 'GSC');
      const epsilon = await create('Épsilon EC', 'EEC');
      const delta = await create('Delta FC', 'DFC');
      await addPlayer(epsilon.id, {
        name: 'Meia Lua',
        position: 'MEI',
        baseValue: '40.00',
      });
      await addPlayer(delta.id, {
        name: 'Zagueiro Forte',
        position: 'ZAG',
        baseValue: '12.50',
      });
      await addPlayer(null, {
        name: 'Jogador Livre',
        position: 'ATA',
        baseValue: '99.00',
      });

      const byName = await service.list(listClubsQuerySchema.parse({}));
      const byNetWorth = await service.list(
        listClubsQuerySchema.parse({ sort: 'net_worth_desc' }),
      );
      const byNetWorthAsc = await service.list(
        listClubsQuerySchema.parse({ sort: 'net_worth_asc' }),
      );

      expect(byName.map((club) => club.name)).toEqual([
        'Delta FC',
        'Épsilon EC',
        'Gama SC',
      ]);
      expect(byNetWorth.map((club) => [club.id, club.net_worth])).toEqual([
        [epsilon.id, 340],
        [delta.id, 312.5],
        [gama.id, 300],
      ]);
      expect(byNetWorthAsc.map((club) => club.id)).toEqual([
        gama.id,
        delta.id,
        epsilon.id,
      ]);
      expect(byName[1]).toEqual({
        id: epsilon.id,
        name: 'Épsilon EC',
        acronym: 'EEC',
        cash: 300,
        squad_value: 40,
        net_worth: 340,
      });
    });

    it('devolve lista vazia sem clubes', async () => {
      expect(await service.list(listClubsQuerySchema.parse({}))).toEqual([]);
    });
  });

  describe('consulta do clube (RN11 e RN15)', () => {
    it('mostra o elenco na ordem e o contrato de cada jogador calculado agora', async () => {
      const club = await create('Águias FC', 'AGU');
      const now = Date.now();
      const atacante = await addPlayer(club.id, {
        name: 'Otto Rangel',
        position: 'ATA',
        baseValue: '30.00',
      });
      const goleiro = await addPlayer(club.id, {
        name: 'Rui Prado',
        position: 'GOL',
        baseValue: '20.00',
      });
      const meia = await addPlayer(club.id, {
        name: 'Lauro Neves',
        position: 'MEI',
        baseValue: '25.00',
      });
      await addContract(atacante.id, club.id, new Date(now - DAY));
      await addContract(
        goleiro.id,
        club.id,
        new Date(now + 10 * DAY + 2 * HOUR),
      );
      await addContract(meia.id, club.id, new Date(now + 200 * DAY));

      const detail = await service.findById(club.id);

      expect(detail.players.map((player) => player.name)).toEqual([
        'Rui Prado',
        'Lauro Neves',
        'Otto Rangel',
      ]);
      expect(
        detail.players.map((player) => [
          player.contract?.remaining_days,
          player.contract?.penalty_rate,
        ]),
      ).toEqual([
        [11, 5],
        [200, 20],
        [0, 0],
      ]);
      expect(detail.players[0].contract).toMatchObject({
        purchase_value: 37,
        loyalty_until: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/,
        ) as unknown,
      });
      expect(detail.players[0]).toMatchObject({
        id: goleiro.id,
        position: 'GOL',
        market_value: 20,
        club_id: club.id,
      });
      expect(detail).toMatchObject({
        cash: 300,
        squad_value: 75,
        net_worth: 375,
      });
    });

    it('não usa contratos que já não estão ativos', async () => {
      const club = await create('Águias FC', 'AGU');
      const player = await addPlayer(club.id, {
        name: 'Rui Prado',
        position: 'GOL',
        baseValue: '20.00',
      });
      await addContract(
        player.id,
        club.id,
        new Date(Date.now() + DAY),
        'RESCINDIDO',
      );
      await addContract(player.id, club.id, new Date(Date.now() + 40 * DAY));

      const [rosterPlayer] = (await service.findById(club.id)).players;

      expect(rosterPlayer.contract).toMatchObject({
        remaining_days: 40,
        penalty_rate: 10,
      });
    });

    it('não mostra jogadores de outros clubes nem os excluídos', async () => {
      const club = await create('Águias FC', 'AGU');
      const other = await create('Delta FC', 'DFC');
      await addPlayer(other.id, {
        name: 'Hugo Vaz',
        position: 'ZAG',
        baseValue: '20.00',
      });

      const detail = await service.findById(club.id);

      expect(detail.players).toEqual([]);
      expect(detail.net_worth).toBe(300);
    });

    it('recusa com 404 o clube inexistente', async () => {
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });
});
