import { Injectable, NotFoundException } from '@nestjs/common';
import { toSortKey } from '../../common/text/text';
import { calculateBaseValue } from './domain/base-value';
import { calculateOverall } from './domain/overall';
import { CreatePlayerInput } from './dto/create-player.schema';
import { PlayerView, toPlayerView } from './player.view';
import { PlayersRepository } from './players.repository';

@Injectable()
export class PlayersService {
  constructor(private readonly players: PlayersRepository) {}

  async create(input: CreatePlayerInput): Promise<PlayerView> {
    const overall = calculateOverall(input.position, input);
    const baseValue = calculateBaseValue({
      overall,
      potential: input.potential,
      age: input.age,
    });
    const player = await this.players.create({
      ...input,
      sortName: toSortKey(input.name),
      baseValue: baseValue.toFixed(2),
    });
    return toPlayerView(player);
  }

  async findById(id: number): Promise<PlayerView> {
    const player = await this.players.findActiveById(id);
    if (!player) {
      throw new NotFoundException('Jogador não encontrado.');
    }
    return toPlayerView(player);
  }
}
