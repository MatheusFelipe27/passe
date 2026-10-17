import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StandingView } from './match.view';
import { MatchesService } from './matches.service';

@ApiTags('Liga')
@Controller('standings')
export class StandingsController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  @ApiOperation({ summary: 'Classificação de todos os clubes' })
  list(): Promise<StandingView[]> {
    return this.matches.standings();
  }
}
