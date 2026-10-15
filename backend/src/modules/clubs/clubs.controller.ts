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
import { ClubDetailView, ClubView } from './club.view';
import { ClubsService } from './clubs.service';
import { createClubSchema } from './dto/create-club.schema';
import type { CreateClubInput } from './dto/create-club.schema';
import { listClubsQuerySchema } from './dto/list-clubs.query';
import type { ListClubsQuery } from './dto/list-clubs.query';

const RESOURCE = 'clubs';

@ApiTags('Clubes')
@Controller(RESOURCE)
export class ClubsController {
  constructor(private readonly clubs: ClubsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os clubes, pelo nome ou pelo patrimônio' })
  @ApiQueryFromSchema(listClubsQuerySchema)
  list(
    @Query(new ZodValidationPipe(listClubsQuerySchema)) query: ListClubsQuery,
  ): Promise<ClubView[]> {
    return this.clubs.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Cria clube com nome e sigla' })
  @ApiBody({ schema: toOpenApiSchema(createClubSchema) })
  async create(
    @Body(new ZodValidationPipe(createClubSchema)) input: CreateClubInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ClubView> {
    const club = await this.clubs.create(input);
    response.location(resourceLocation(RESOURCE, club.id));
    return club;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Clube com o elenco, os contratos e o patrimônio' })
  findById(
    @Param('id', ParseResourceIdPipe) id: number,
  ): Promise<ClubDetailView> {
    return this.clubs.findById(id);
  }
}
