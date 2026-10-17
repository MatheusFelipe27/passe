import { Module } from '@nestjs/common';
import { ClubsModule } from '../clubs/clubs.module';
import { LineupsController } from './lineups.controller';
import { LineupsRepository } from './lineups.repository';
import { LineupsService } from './lineups.service';

@Module({
  imports: [ClubsModule],
  controllers: [LineupsController],
  providers: [LineupsService, LineupsRepository],
  exports: [LineupsRepository],
})
export class LineupsModule {}
