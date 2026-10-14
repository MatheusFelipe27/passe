import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClubsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async exists(id: number): Promise<boolean> {
    return (await this.prisma.club.count({ where: { id } })) > 0;
  }
}
