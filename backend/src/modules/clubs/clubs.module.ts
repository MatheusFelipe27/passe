import { Module } from '@nestjs/common';
import { ClubsRepository } from './clubs.repository';

@Module({
  providers: [ClubsRepository],
  exports: [ClubsRepository],
})
export class ClubsModule {}
