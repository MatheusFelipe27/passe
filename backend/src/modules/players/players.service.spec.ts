import { ConflictException, NotFoundException } from '@nestjs/common';
import { Player, Prisma } from '../../generated/prisma/client';
import { DbClient, TransactionRunner } from '../../prisma/transaction-runner';
import { ClubsRepository } from '../clubs/clubs.repository';
import { LineupsRepository } from '../lineups/lineups.repository';
import { Condition } from './domain/player.types';
import { CreatePlayerInput } from './dto/create-player.schema';
import { ListPlayersQuery } from './dto/list-players.query';
import { UpdatePlayerInput } from './dto/update-player.schema';
import {
  NewPlayer,
  PlayerChanges,
  PlayersRepository,
} from './players.repository';
import { PlayersService } from './players.service';

const input: CreatePlayerInput = {
  name: 'Meia Lua',
  position: 'MEI',
  agility: 85,
  age: 25,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
};

const edit: UpdatePlayerInput = {
  name: 'Meia Lua',
  position: 'MEI',
  agility: 85,
  age: 25,
};

const db = {} as DbClient;

type MockOf<T, K extends keyof T> = Record<K, jest.Mock>;

function storedPlayer(fields: Partial<Player> = {}): Player {
  return {
    id: 2,
    ...input,
    sortName: 'meia lua',
    baseValue: new Prisma.Decimal('40.00'),
    condition: 'APTO',
    clubId: null,
    deletedAt: null,
    createdAt: new Date('2026-11-02T13:15:00Z'),
    updatedAt: new Date('2026-11-02T13:15:00Z'),
    ...fields,
  };
}

describe('PlayersService', () => {
  let current: Player | null;
  let players: MockOf<
    PlayersRepository,
    | 'create'
    | 'findActiveById'
    | 'lockActiveById'
    | 'update'
    | 'updateCondition'
    | 'softDelete'
    | 'list'
  >;
  let clubs: MockOf<ClubsRepository, 'exists'>;
  let lineups: MockOf<LineupsRepository, 'removePlayer'>;
  let service: PlayersService;

  beforeEach(() => {
    current = storedPlayer();
    players = {
      create: jest.fn((player: NewPlayer) =>
        Promise.resolve(
          storedPlayer({
            ...player,
            baseValue: new Prisma.Decimal(player.baseValue),
          }),
        ),
      ),
      findActiveById: jest.fn(() => Promise.resolve(current)),
      lockActiveById: jest.fn(() => Promise.resolve(current)),
      update: jest.fn((_id: number, changes: PlayerChanges) =>
        Promise.resolve(storedPlayer({ ...current, ...changes })),
      ),
      updateCondition: jest.fn((_id: number, condition: Condition) =>
        Promise.resolve(storedPlayer({ ...current, condition })),
      ),
      softDelete: jest.fn(() => Promise.resolve()),
      list: jest.fn(() => Promise.resolve({ players: [], total: 0 })),
    };
    clubs = { exists: jest.fn(() => Promise.resolve(true)) };
    lineups = { removePlayer: jest.fn(() => Promise.resolve()) };
    const transactions = {
      run: <T>(work: (client: DbClient) => Promise<T>) => work(db),
    };
    service = new PlayersService(
      players as unknown as PlayersRepository,
      lineups,
      clubs as unknown as ClubsRepository,
      transactions as unknown as TransactionRunner,
    );
  });

  describe('create', () => {
    it('grava o valor base calculado pelo overall do cadastro', async () => {
      await service.create(input);

      expect(players.create).toHaveBeenCalledWith({
        ...input,
        sortName: 'meia lua',
        baseValue: '40.00',
      });
    });

    it('aplica o bônus de jovem promessa ao valor base', async () => {
      await service.create({ ...input, age: 21 });

      expect(players.create).toHaveBeenCalledWith(
        expect.objectContaining({ baseValue: '44.40' }),
      );
    });

    it('grava o nome de ordenação em minúsculas e sem acentos', async () => {
      await service.create({ ...input, name: 'João Conceição' });

      expect(players.create).toHaveBeenCalledWith(
        expect.objectContaining({ sortName: 'joao conceicao' }),
      );
    });

    it('devolve o jogador livre e APTO, com overall e valor de mercado', async () => {
      const player = await service.create(input);

      expect(player).toEqual({
        id: 2,
        ...input,
        condition: 'APTO',
        base_value: 40,
        market_value: 40,
        overall: 75,
        club_id: null,
      });
    });
  });

  describe('list', () => {
    const query: ListPlayersQuery = { sort: ['name'], page: 1, limit: 10 };

    it.each([
      [23, 10, 1, 3],
      [23, 10, 3, 3],
      [23, 10, 4, 3],
      [23, 50, 1, 1],
      [20, 10, 1, 2],
      [21, 10, 1, 3],
      [1, 10, 1, 1],
      [0, 10, 1, 0],
    ])(
      '%i itens com limit %i na página %i dão %i páginas',
      async (total, limit, page, totalPages) => {
        players.list.mockResolvedValue({ players: [], total });

        const result = await service.list({ ...query, page, limit });

        expect(result.meta).toEqual({
          page,
          limit,
          total_items: total,
          total_pages: totalPages,
        });
      },
    );

    it('devolve os jogadores na ordem do banco, com os valores calculados', async () => {
      players.list.mockResolvedValue({
        players: [
          storedPlayer({ id: 5, condition: 'MAL_CONDICIONADO' }),
          storedPlayer({ id: 3 }),
        ],
        total: 2,
      });

      const result = await service.list(query);

      expect(result.data.map((player) => player.id)).toEqual([5, 3]);
      expect(result.data.map((player) => player.market_value)).toEqual([
        37, 40,
      ]);
    });

    it('recusa com 404 o filtro por clube inexistente', async () => {
      clubs.exists.mockResolvedValue(false);

      await expect(service.list({ ...query, clubId: 99 })).rejects.toThrow(
        NotFoundException,
      );
      expect(players.list).not.toHaveBeenCalled();
    });

    it('não consulta o clube quando não há filtro por clube', async () => {
      await service.list(query);

      expect(clubs.exists).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('calcula o valor de mercado pela condição, agilidade e idade atuais', async () => {
      current = storedPlayer({ condition: 'MAL_CONDICIONADO' });

      const player = await service.findById(2);

      expect(player.base_value).toBe(40);
      expect(player.market_value).toBe(37);
    });

    it('calcula o overall pela posição atual', async () => {
      current = storedPlayer({ position: 'ATA' });

      const player = await service.findById(2);

      expect(player.overall).toBe(72);
    });

    it('devolve o clube do jogador', async () => {
      current = storedPlayer({ clubId: 1 });

      const player = await service.findById(2);

      expect(player.club_id).toBe(1);
    });

    it('recusa com 404 quando o jogador não existe ou foi excluído', async () => {
      current = null;

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('grava os quatro campos e o novo nome de ordenação', async () => {
      await service.update(2, { ...edit, name: 'Meia Lua Filho', agility: 60 });

      expect(players.update).toHaveBeenCalledWith(
        2,
        {
          name: 'Meia Lua Filho',
          sortName: 'meia lua filho',
          position: 'MEI',
          agility: 60,
          age: 25,
        },
        db,
      );
    });

    it('mantém o valor base e recalcula o overall pela nova posição', async () => {
      const player = await service.update(2, { ...edit, position: 'ATA' });

      expect(player.base_value).toBe(40);
      expect(player.overall).toBe(72);
    });

    it.each([
      [24, false],
      [25, true],
      [26, true],
    ])('idade %i com a atual em 25 aceita = %s', async (age, accepted) => {
      const result = service.update(2, { ...edit, age });

      if (accepted) {
        await expect(result).resolves.toBeDefined();
      } else {
        await expect(result).rejects.toThrow(ConflictException);
        expect(players.update).not.toHaveBeenCalled();
      }
    });

    it('aceita a idade que chega a 33 sem mudar o potencial', async () => {
      const player = await service.update(2, { ...edit, age: 33 });

      expect(player.age).toBe(33);
      expect(player.potential).toBe(86);
    });

    it.each([
      [null, 'ATA', true],
      [1, 'MEI', true],
      [1, 'ATA', false],
    ])(
      'clube %s mudando para %s aceito = %s',
      async (clubId, position, accepted) => {
        current = storedPlayer({ clubId });

        const result = service.update(2, {
          ...edit,
          position: position as UpdatePlayerInput['position'],
        });

        if (accepted) {
          await expect(result).resolves.toBeDefined();
        } else {
          await expect(result).rejects.toThrow(ConflictException);
          expect(players.update).not.toHaveBeenCalled();
        }
      },
    );

    it('recusa com 404 o jogador inexistente ou excluído', async () => {
      current = null;

      await expect(service.update(999, edit)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changeCondition', () => {
    it.each<[Condition, Condition]>([
      ['APTO', 'MAL_CONDICIONADO'],
      ['APTO', 'DOENTE'],
      ['MAL_CONDICIONADO', 'APTO'],
      ['MAL_CONDICIONADO', 'DOENTE'],
      ['DOENTE', 'MAL_CONDICIONADO'],
    ])('aceita de %s para %s', async (from, to) => {
      current = storedPlayer({ condition: from });

      const player = await service.changeCondition(2, to);

      expect(player.condition).toBe(to);
      expect(players.updateCondition).toHaveBeenCalledWith(2, to, db);
    });

    it('recusa com 409 de DOENTE direto para APTO, sem gravar', async () => {
      current = storedPlayer({ condition: 'DOENTE' });

      await expect(service.changeCondition(2, 'APTO')).rejects.toThrow(
        ConflictException,
      );
      expect(players.updateCondition).not.toHaveBeenCalled();
      expect(lineups.removePlayer).not.toHaveBeenCalled();
    });

    it.each<Condition>(['APTO', 'MAL_CONDICIONADO', 'DOENTE'])(
      'aceita a condição atual (%s) sem mudar nada',
      async (condition) => {
        current = storedPlayer({ condition });

        const player = await service.changeCondition(2, condition);

        expect(player.condition).toBe(condition);
        expect(players.updateCondition).not.toHaveBeenCalled();
        expect(lineups.removePlayer).not.toHaveBeenCalled();
      },
    );

    it.each<Condition>(['APTO', 'MAL_CONDICIONADO'])(
      'tira da escalação quem passa de %s a DOENTE',
      async (from) => {
        current = storedPlayer({ condition: from });

        await service.changeCondition(2, 'DOENTE');

        expect(lineups.removePlayer).toHaveBeenCalledWith(2, db);
      },
    );

    it.each<[Condition, Condition]>([
      ['APTO', 'MAL_CONDICIONADO'],
      ['MAL_CONDICIONADO', 'APTO'],
      ['DOENTE', 'MAL_CONDICIONADO'],
    ])('mantém na escalação de %s para %s', async (from, to) => {
      current = storedPlayer({ condition: from });

      await service.changeCondition(2, to);

      expect(lineups.removePlayer).not.toHaveBeenCalled();
    });

    it('devolve o valor de mercado com a nova condição', async () => {
      const player = await service.changeCondition(2, 'MAL_CONDICIONADO');

      expect(player.market_value).toBe(37);
    });

    it('recusa com 404 o jogador inexistente ou excluído', async () => {
      current = null;

      await expect(service.changeCondition(999, 'APTO')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('exclui o jogador livre', async () => {
      await service.remove(2);

      expect(players.softDelete).toHaveBeenCalledWith(2, db);
    });

    it('recusa com 409 o jogador com clube, sem gravar', async () => {
      current = storedPlayer({ clubId: 1 });

      await expect(service.remove(2)).rejects.toThrow(ConflictException);
      expect(players.softDelete).not.toHaveBeenCalled();
    });

    it('recusa com 404 o jogador inexistente ou já excluído', async () => {
      current = null;

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(players.softDelete).not.toHaveBeenCalled();
    });
  });
});
