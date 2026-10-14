import { NotFoundException } from '@nestjs/common';
import { Player, Prisma } from '../../generated/prisma/client';
import { CreatePlayerInput } from './dto/create-player.schema';
import { NewPlayer, PlayersRepository } from './players.repository';
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
  let repository: jest.Mocked<
    Pick<PlayersRepository, 'create' | 'findActiveById'>
  >;
  let service: PlayersService;

  beforeEach(() => {
    repository = {
      create: jest.fn((player: NewPlayer) =>
        Promise.resolve(
          storedPlayer({
            ...player,
            baseValue: new Prisma.Decimal(player.baseValue),
          }),
        ),
      ),
      findActiveById: jest.fn(),
    };
    service = new PlayersService(repository as unknown as PlayersRepository);
  });

  describe('create', () => {
    it('grava o valor base calculado pelo overall do cadastro', async () => {
      await service.create(input);

      expect(repository.create).toHaveBeenCalledWith({
        ...input,
        sortName: 'meia lua',
        baseValue: '40.00',
      });
    });

    it('aplica o bônus de jovem promessa ao valor base', async () => {
      await service.create({ ...input, age: 21 });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ baseValue: '44.40' }),
      );
    });

    it('grava o nome de ordenação em minúsculas e sem acentos', async () => {
      await service.create({ ...input, name: 'João Conceição' });

      expect(repository.create).toHaveBeenCalledWith(
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

  describe('findById', () => {
    it('calcula o valor de mercado pela condição, agilidade e idade atuais', async () => {
      repository.findActiveById.mockResolvedValue(
        storedPlayer({ condition: 'MAL_CONDICIONADO' }),
      );

      const player = await service.findById(2);

      expect(player.base_value).toBe(40);
      expect(player.market_value).toBe(37);
    });

    it('calcula o overall pela posição atual', async () => {
      repository.findActiveById.mockResolvedValue(
        storedPlayer({ position: 'ATA' }),
      );

      const player = await service.findById(2);

      expect(player.overall).toBe(72);
    });

    it('devolve o clube do jogador', async () => {
      repository.findActiveById.mockResolvedValue(storedPlayer({ clubId: 1 }));

      const player = await service.findById(2);

      expect(player.club_id).toBe(1);
    });

    it('recusa com 404 quando o jogador não existe ou foi excluído', async () => {
      repository.findActiveById.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });
});
