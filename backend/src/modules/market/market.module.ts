import { Module } from '@nestjs/common';
import { ClubsModule } from '../clubs/clubs.module';
import { LineupsModule } from '../lineups/lineups.module';
import { PlayersModule } from '../players/players.module';
import { MarketController } from './market.controller';
import { MarketRepository } from './market.repository';
import { MarketService } from './market.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [ClubsModule, PlayersModule, LineupsModule],
  controllers: [MarketController, TransactionsController],
  providers: [MarketService, TransactionsService, MarketRepository],
})
export class MarketModule {}
