import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TransactionRunner } from '../../prisma/transaction-runner';
import { ClubsRepository } from '../clubs/clubs.repository';
import { Position } from '../players/domain/player.types';
import { describeFormation, fitsFormation } from './domain/formation';
import { SaveLineupInput } from './dto/save-lineup.schema';
import { LineupView, toLineupView } from './lineup.view';
import { LineupsRepository } from './lineups.repository';

@Injectable()
export class LineupsService {
  constructor(
    private readonly lineups: LineupsRepository,
    private readonly clubs: ClubsRepository,
    private readonly transactions: TransactionRunner,
  ) {}

  async find(clubId: number): Promise<LineupView> {
    const club = await this.clubs.findById(clubId);
    if (!club) {
      throw new NotFoundException('Clube não encontrado.');
    }
    return toLineupView(club, await this.lineups.findStarters(clubId));
  }

  // RN19: confere tudo com os jogadores e o clube travados, na mesma ordem da venda, e só então grava.
  async save(clubId: number, input: SaveLineupInput): Promise<LineupView> {
    if (!(await this.clubs.exists(clubId))) {
      throw new NotFoundException('Clube não encontrado.');
    }
    return this.transactions.run(async (db) => {
      const players = await this.lineups.lockActivePlayers(input.playerIds, db);
      if (players.length !== input.playerIds.length) {
        throw new NotFoundException('Jogador não encontrado.');
      }
      const club = await this.clubs.lock(clubId, db);
      if (!club) {
        throw new NotFoundException('Clube não encontrado.');
      }
      const outsider = players.find((player) => player.clubId !== club.id);
      if (outsider) {
        throw new ConflictException(
          `${outsider.name} não é do elenco do ${club.name}.`,
        );
      }
      const sick = players.find((player) => player.condition === 'DOENTE');
      if (sick) {
        throw new ConflictException(
          `${sick.name} está DOENTE e não pode ser escalado.`,
        );
      }
      const positions = players.map((player) => player.position as Position);
      if (!fitsFormation(positions, input.formation)) {
        throw new ConflictException(
          `As posições não fecham a formação ${input.formation}: ela pede ${describeFormation(input.formation)}.`,
        );
      }

      await this.lineups.replace(club.id, input.formation, input.playerIds, db);
      return toLineupView({ ...club, formation: input.formation }, players);
    });
  }
}
