import { Injectable } from '@nestjs/common';
import { Player } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PlayerAttributes, Position } from './domain/player.types';

export interface NewPlayer extends PlayerAttributes {
  name: string;
  sortName: string;
  position: Position;
  agility: number;
  age: number;
  potential: number;
  baseValue: string;
}

@Injectable()
export class PlayersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(player: NewPlayer): Promise<Player> {
    return this.prisma.player.create({ data: player });
  }

  findActiveById(id: number): Promise<Player | null> {
    return this.prisma.player.findFirst({ where: { id, deletedAt: null } });
  }
}
