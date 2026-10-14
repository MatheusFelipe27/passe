import { Module } from '@nestjs/common';
import { LineupsRepository } from './lineups.repository';

@Module({
  providers: [LineupsRepository],
  exports: [LineupsRepository],
})
export class LineupsModule {}
