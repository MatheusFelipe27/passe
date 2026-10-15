import { Module } from '@nestjs/common';
import { LineupsModule } from '../lineups/lineups.module';
import { PlayersModule } from '../players/players.module';
import { MarketController } from './market.controller';
import { MarketRepository } from './market.repository';
import { MarketService } from './market.service';

@Module({
  imports: [PlayersModule, LineupsModule],
  controllers: [MarketController],
  providers: [MarketService, MarketRepository],
})
export class MarketModule {}
