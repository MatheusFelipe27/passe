import { Module } from '@nestjs/common';
import { ClubsModule } from '../clubs/clubs.module';
import { LineupsModule } from '../lineups/lineups.module';
import { MatchesController } from './matches.controller';
import { MatchesRepository } from './matches.repository';
import { MatchesService } from './matches.service';
import { StandingsController } from './standings.controller';

@Module({
  imports: [ClubsModule, LineupsModule],
  controllers: [MatchesController, StandingsController],
  providers: [MatchesService, MatchesRepository],
})
export class MatchesModule {}
