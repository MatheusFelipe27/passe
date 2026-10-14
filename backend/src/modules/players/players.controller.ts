import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { resourceLocation } from '../../common/http/api-prefix';
import { ParseResourceIdPipe } from '../../common/pipes/parse-resource-id.pipe';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { toOpenApiSchema } from '../../common/validation/open-api';
import { createPlayerSchema } from './dto/create-player.schema';
import type { CreatePlayerInput } from './dto/create-player.schema';
import { PlayerView } from './player.view';
import { PlayersService } from './players.service';

const RESOURCE = 'players';

@ApiTags('Jogadores')
@Controller(RESOURCE)
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra jogador' })
  @ApiBody({ schema: toOpenApiSchema(createPlayerSchema) })
  async create(
    @Body(new ZodValidationPipe(createPlayerSchema)) input: CreatePlayerInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PlayerView> {
    const player = await this.players.create(input);
    response.location(resourceLocation(RESOURCE, player.id));
    return player;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um jogador' })
  findById(@Param('id', ParseResourceIdPipe) id: number): Promise<PlayerView> {
    return this.players.findById(id);
  }
}
