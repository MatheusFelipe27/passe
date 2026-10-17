import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { resourceLocation } from '../../common/http/api-prefix';
import { ParseResourceIdPipe } from '../../common/pipes/parse-resource-id.pipe';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  ApiQueryFromSchema,
  toOpenApiSchema,
} from '../../common/validation/open-api';
import { listMatchesQuerySchema } from './dto/list-matches.query';
import type { ListMatchesQuery } from './dto/list-matches.query';
import { playMatchSchema } from './dto/play-match.schema';
import type { PlayMatchInput } from './dto/play-match.schema';
import { MatchDetailView, MatchView } from './match.view';
import { MatchesService } from './matches.service';

const RESOURCE = 'matches';

@ApiTags('Liga')
@Controller(RESOURCE)
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Post()
  @ApiOperation({ summary: 'Joga uma partida e grava o resultado' })
  @ApiBody({ schema: toOpenApiSchema(playMatchSchema) })
  async play(
    @Body(new ZodValidationPipe(playMatchSchema)) input: PlayMatchInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MatchDetailView> {
    const match = await this.matches.play(input);
    response.location(resourceLocation(RESOURCE, match.id));
    return match;
  }

  @Get()
  @ApiOperation({
    summary: 'Histórico de partidas, da mais recente à mais antiga',
  })
  @ApiQueryFromSchema(listMatchesQuerySchema)
  list(
    @Query(new ZodValidationPipe(listMatchesQuerySchema))
    query: ListMatchesQuery,
  ): Promise<MatchView[]> {
    return this.matches.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Partida com os 6 duelos' })
  findById(
    @Param('id', ParseResourceIdPipe) id: number,
  ): Promise<MatchDetailView> {
    return this.matches.findById(id);
  }
}
