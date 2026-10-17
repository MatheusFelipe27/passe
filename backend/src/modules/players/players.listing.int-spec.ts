import { NotFoundException } from '@nestjs/common';
import {
  clearDatabase,
  createTestPrisma,
} from '../../../test/integration/test-database';
import { toSortKey } from '../../common/text/text';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionRunner } from '../../prisma/transaction-runner';
import { ClubsRepository } from '../clubs/clubs.repository';
import { LineupsRepository } from '../lineups/lineups.repository';
import { Condition, POSITIONS } from './domain/player.types';
import { CreatePlayerInput } from './dto/create-player.schema';
import {
  ListPlayersQuery,
  listPlayersQuerySchema,
  PlayerSortKey,
} from './dto/list-players.query';
import { PlayerView } from './player.view';
import { PlayersRepository } from './players.repository';
import { PlayersService } from './players.service';

const defaults: CreatePlayerInput = {
  name: 'Jogador Teste',
  position: 'MEI',
  agility: 50,
  age: 25,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
};

interface PlayerSetup extends Partial<CreatePlayerInput> {
  condition?: Condition;
  clubId?: number;
}

describe('GET /players (listagem no banco)', () => {
  let prisma: PrismaService;
  let service: PlayersService;

  async function addPlayer(setup: PlayerSetup = {}): Promise<PlayerView> {
    const { condition, clubId, ...fields } = setup;
    const created = await service.create({ ...defaults, ...fields });
    if (condition !== undefined || clubId !== undefined) {
      await prisma.player.update({
        where: { id: created.id },
        data: { condition, clubId },
      });
    }
    return service.findById(created.id);
  }

  async function addClub(acronym: string): Promise<number> {
    const club = await prisma.club.create({
      data: {
        name: `Clube ${acronym}`,
        normalizedName: `clube ${acronym.toLowerCase()}`,
        acronym,
      },
    });
    return club.id;
  }

  async function list(params: Record<string, string> = {}) {
    const query: ListPlayersQuery = listPlayersQuerySchema.parse({
      limit: '50',
      ...params,
    });
    return service.list(query);
  }

  async function listIds(params: Record<string, string> = {}) {
    return (await list(params)).data.map((player) => player.id);
  }

  beforeAll(async () => {
    prisma = createTestPrisma();
    await prisma.$connect();
    service = new PlayersService(
      new PlayersRepository(prisma),
      new LineupsRepository(prisma),
      new ClubsRepository(prisma),
      new TransactionRunner(prisma),
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('busca pelo nome', () => {
    let joao: PlayerView;
    let joana: PlayerView;
    let meiaLua: PlayerView;

    beforeAll(async () => {
      await clearDatabase(prisma);
      joao = await addPlayer({ name: 'João Silva' });
      joana = await addPlayer({ name: 'Joana Prado' });
      meiaLua = await addPlayer({ name: 'Meia Lua' });
      await addPlayer({ name: 'Conceição Souza' });
    });

    it.each([
      ['joao', () => [joao]],
      ['JOÃO', () => [joao]],
      ['LUA', () => [meiaLua]],
      ['jo', () => [joana, joao]],
      ['ia lu', () => [meiaLua]],
      ['silva', () => [joao]],
    ])('"%s" encontra só os nomes que o contêm', async (search, expected) => {
      expect(await listIds({ search })).toEqual(expected().map((p) => p.id));
    });

    it('ignora acentos e cedilha no nome gravado', async () => {
      expect(await list({ search: 'conceicao' })).toMatchObject({
        meta: { total_items: 1 },
      });
    });

    it.each(['%a', '_a', 'a%', '\\a'])(
      'trata "%s" como texto, e não como curinga',
      async (search) => {
        expect(await listIds({ search })).toEqual([]);
      },
    );
  });

  describe('ordem alfabética', () => {
    beforeEach(async () => {
      await clearDatabase(prisma);
    });

    it('segue o exemplo das Premissas: espaço, hífen e letras sem acento', async () => {
      const names = [
        'Gama Rocha',
        'Ana-Maria Souza',
        'Épsilon Reis',
        'Ana Lima',
        'Delta Melo',
      ];
      for (const name of names) {
        await addPlayer({ name });
      }

      const result = await list({ sort: 'name' });

      expect(result.data.map((player) => player.name)).toEqual([
        'Ana Lima',
        'Ana-Maria Souza',
        'Delta Melo',
        'Épsilon Reis',
        'Gama Rocha',
      ]);
    });

    it('desempata nomes iguais na comparação pelo id', async () => {
      const first = await addPlayer({ name: 'Águias Ze' });
      const second = await addPlayer({ name: 'Aguias Ze' });
      const third = await addPlayer({ name: 'águias ze' });

      expect(await listIds({ sort: 'name' })).toEqual([
        first.id,
        second.id,
        third.id,
      ]);
    });
  });

  describe('ordenações', () => {
    let players: PlayerView[];

    beforeAll(async () => {
      await clearDatabase(prisma);
      const setups: PlayerSetup[] = [
        { name: 'Bruno Alves', position: 'ATA', age: 30, condition: 'DOENTE' },
        { name: 'Bruno Alves', position: 'GOL', age: 22 },
        { name: 'Ana Costa', position: 'MEI', age: 19 },
        {
          name: 'Caio Dias',
          position: 'ZAG',
          age: 33,
          condition: 'MAL_CONDICIONADO',
        },
        {
          name: 'Davi Eloi',
          position: 'LAT',
          age: 25,
          agility: 85,
          condition: 'MAL_CONDICIONADO',
        },
        { name: 'Elias Faro', position: 'MEI', age: 25 },
        { name: 'Fábio Gil', position: 'MEI', age: 25 },
        {
          name: 'Gil Hora',
          position: 'ATA',
          age: 40,
          agility: 20,
          condition: 'DOENTE',
        },
        { name: 'Hugo Ivo', position: 'GOL', age: 21, potential: 99 },
        { name: 'Ivo Jota', position: 'ZAG', age: 32 },
      ];
      players = [];
      for (const setup of setups) {
        players.push(await addPlayer(setup));
      }
    });

    const SORT_VALUE: Record<PlayerSortKey, (player: PlayerView) => number> = {
      name: () => 0,
      value_asc: (player) => player.market_value,
      value_desc: (player) => -player.market_value,
      age_asc: (player) => player.age,
      age_desc: (player) => -player.age,
      position: (player) => POSITIONS.indexOf(player.position),
    };

    function expectedOrder(sort: PlayerSortKey[]): number[] {
      return [...players]
        .sort((a, b) => {
          for (const key of sort) {
            const difference = SORT_VALUE[key](a) - SORT_VALUE[key](b);
            if (difference !== 0) {
              return difference;
            }
          }
          const nameA = toSortKey(a.name);
          const nameB = toSortKey(b.name);
          if (nameA !== nameB) {
            return nameA < nameB ? -1 : 1;
          }
          return a.id - b.id;
        })
        .map((player) => player.id);
    }

    it.each([
      'name',
      'value_asc',
      'value_desc',
      'age_asc',
      'age_desc',
      'position',
      'position,value_desc',
      'position,age_asc',
      'value_desc,age_asc',
      'age_desc,position',
    ])('sort=%s, com desempate pelo nome e pelo id', async (sort) => {
      const keys = sort.split(',') as PlayerSortKey[];

      expect(await listIds({ sort })).toEqual(expectedOrder(keys));
    });

    it('usa o valor de mercado, e não o valor base', async () => {
      const values = (await list({ sort: 'value_desc' })).data.map(
        (player) => player.market_value,
      );

      expect(values).toEqual([...values].sort((a, b) => b - a));
    });
  });

  describe('filtros', () => {
    let goleiro: PlayerView;
    let zagueiro: PlayerView;
    let meia: PlayerView;
    let atacante: PlayerView;
    let lateral: PlayerView;
    let clubA: number;
    let clubB: number;

    beforeAll(async () => {
      await clearDatabase(prisma);
      clubA = await addClub('AAA');
      clubB = await addClub('BBB');
      goleiro = await addPlayer({
        name: 'Goleiro Um',
        position: 'GOL',
        age: 20,
      });
      zagueiro = await addPlayer({
        name: 'Zagueiro Dois',
        position: 'ZAG',
        age: 25,
        condition: 'MAL_CONDICIONADO',
      });
      meia = await addPlayer({
        name: 'Meia Tres',
        position: 'MEI',
        age: 30,
        condition: 'DOENTE',
        clubId: clubA,
      });
      atacante = await addPlayer({
        name: 'Atacante Quatro',
        position: 'ATA',
        age: 35,
        potential: 82,
        clubId: clubB,
      });
      lateral = await addPlayer({
        name: 'Lateral Cinco',
        position: 'LAT',
        age: 45,
        potential: 82,
        clubId: clubA,
      });
    });

    function ids(...players: PlayerView[]): number[] {
      return players.map((player) => player.id);
    }

    it.each([
      [{ position: 'ZAG' }, () => ids(zagueiro)],
      [{ condition: 'APTO' }, () => ids(atacante, goleiro, lateral)],
      [{ free: 'true' }, () => ids(goleiro, zagueiro)],
      [{ free: 'false' }, () => ids(atacante, lateral, meia)],
      [{ club_id: '1' }, () => ids(lateral, meia)],
      [{ club_id: '1', free: 'false' }, () => ids(lateral, meia)],
      [{ min_age: '25', max_age: '35' }, () => ids(atacante, meia, zagueiro)],
      [{ min_age: '45' }, () => ids(lateral)],
      [{ max_age: '20' }, () => ids(goleiro)],
      [{ condition: 'APTO', free: 'false' }, () => ids(atacante, lateral)],
      [{ position: 'MEI', free: 'true' }, () => []],
    ])('%j', async (params, expected) => {
      expect(await listIds(params as Record<string, string>)).toEqual(
        expected(),
      );
    });

    it('filtra pelo valor de mercado, com os limites inclusivos', async () => {
      const value = zagueiro.market_value;
      const cents = (amount: number) => (amount / 100).toFixed(2);
      const exact = value.toFixed(2);
      const above = cents(Math.round(value * 100) + 1);
      const below = cents(Math.round(value * 100) - 1);

      expect(await listIds({ min_value: exact, max_value: exact })).toContain(
        zagueiro.id,
      );
      expect(await listIds({ min_value: above })).not.toContain(zagueiro.id);
      expect(await listIds({ max_value: below })).not.toContain(zagueiro.id);
      expect(await listIds({ min_value: below, max_value: above })).toContain(
        zagueiro.id,
      );
    });

    it('não mostra o jogador excluído', async () => {
      await service.remove(goleiro.id);

      expect(await listIds()).not.toContain(goleiro.id);
      expect((await list()).meta.total_items).toBe(4);
    });

    it('recusa com 404 o clube inexistente', async () => {
      await expect(list({ club_id: '999' })).rejects.toThrow(NotFoundException);
    });

    it('usa o clube criado no setup como clube 1 e 2', () => {
      expect([clubA, clubB]).toEqual([1, 2]);
    });
  });

  describe('paginação', () => {
    beforeAll(async () => {
      await clearDatabase(prisma);
      for (let index = 1; index <= 23; index++) {
        await addPlayer({ name: `Jogador ${String.fromCharCode(64 + index)}` });
      }
    });

    it.each([
      ['10', '1', 10, 'Jogador A', 3],
      ['10', '3', 3, 'Jogador U', 3],
      ['10', '4', 0, undefined, 3],
      ['50', '1', 23, 'Jogador A', 1],
      ['1', '23', 1, 'Jogador W', 23],
    ])(
      'limit %s e página %s trazem %i itens',
      async (limit, page, count, firstName, totalPages) => {
        const result = await list({ limit, page });

        expect(result.data).toHaveLength(count);
        expect(result.data[0]?.name).toBe(firstName);
        expect(result.meta).toEqual({
          page: Number(page),
          limit: Number(limit),
          total_items: 23,
          total_pages: totalPages,
        });
      },
    );

    it('conta todos os que atendem aos filtros, não só os da página', async () => {
      const result = await list({ limit: '5', search: 'jogador' });

      expect(result.data).toHaveLength(5);
      expect(result.meta.total_items).toBe(23);
    });

    it('devolve lista vazia e meta zerado sem resultados', async () => {
      expect(await list({ search: 'ninguem' })).toEqual({
        data: [],
        meta: { page: 1, limit: 50, total_items: 0, total_pages: 0 },
      });
    });
  });
});
