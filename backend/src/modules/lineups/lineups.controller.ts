import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseResourceIdPipe } from '../../common/pipes/parse-resource-id.pipe';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { toOpenApiSchema } from '../../common/validation/open-api';
import { saveLineupSchema } from './dto/save-lineup.schema';
import type { SaveLineupInput } from './dto/save-lineup.schema';
import { LineupView } from './lineup.view';
import { LineupsService } from './lineups.service';

@ApiTags('Liga')
@Controller('clubs')
export class LineupsController {
  constructor(private readonly lineups: LineupsService) {}

  @Put(':id/lineup')
  @ApiOperation({ summary: 'Escolhe a formação e escala os 5 titulares' })
  @ApiBody({ schema: toOpenApiSchema(saveLineupSchema) })
  save(
    @Param('id', ParseResourceIdPipe) id: number,
    @Body(new ZodValidationPipe(saveLineupSchema)) input: SaveLineupInput,
  ): Promise<LineupView> {
    return this.lineups.save(id, input);
  }

  @Get(':id/lineup')
  @ApiOperation({ summary: 'Escalação atual do clube, com a formação' })
  find(@Param('id', ParseResourceIdPipe) id: number): Promise<LineupView> {
    return this.lineups.find(id);
  }
}
