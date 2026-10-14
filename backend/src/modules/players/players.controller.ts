import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { resourceLocation } from '../../common/http/api-prefix';
import { ParseResourceIdPipe } from '../../common/pipes/parse-resource-id.pipe';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { toOpenApiSchema } from '../../common/validation/open-api';
import { changeConditionSchema } from './dto/change-condition.schema';
import type { ChangeConditionInput } from './dto/change-condition.schema';
import { createPlayerSchema } from './dto/create-player.schema';
import type { CreatePlayerInput } from './dto/create-player.schema';
import { updatePlayerSchema } from './dto/update-player.schema';
import type { UpdatePlayerInput } from './dto/update-player.schema';
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

  @Put(':id')
  @ApiOperation({ summary: 'Edita nome, posição, agilidade e idade' })
  @ApiBody({ schema: toOpenApiSchema(updatePlayerSchema) })
  update(
    @Param('id', ParseResourceIdPipe) id: number,
    @Body(new ZodValidationPipe(updatePlayerSchema)) input: UpdatePlayerInput,
  ): Promise<PlayerView> {
    return this.players.update(id, input);
  }

  @Patch(':id/condition')
  @ApiOperation({ summary: 'Altera a condição física' })
  @ApiBody({ schema: toOpenApiSchema(changeConditionSchema) })
  changeCondition(
    @Param('id', ParseResourceIdPipe) id: number,
    @Body(new ZodValidationPipe(changeConditionSchema))
    input: ChangeConditionInput,
  ): Promise<PlayerView> {
    return this.players.changeCondition(id, input.condition);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclusão lógica de jogador livre' })
  remove(@Param('id', ParseResourceIdPipe) id: number): Promise<void> {
    return this.players.remove(id);
  }
}
