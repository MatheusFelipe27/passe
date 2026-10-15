import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseResourceIdPipe } from '../../common/pipes/parse-resource-id.pipe';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { toOpenApiSchema } from '../../common/validation/open-api';
import { buyPlayerSchema } from './dto/buy-player.schema';
import type { BuyPlayerInput } from './dto/buy-player.schema';
import { PurchaseView, SaleView } from './market.view';
import { MarketService } from './market.service';

// Compra e venda respondem 200, e não 201: não criam um recurso no caminho pedido.
@ApiTags('Mercado')
@Controller('players')
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Post(':id/buy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compra jogador livre e cria o contrato' })
  @ApiBody({ schema: toOpenApiSchema(buyPlayerSchema) })
  buy(
    @Param('id', ParseResourceIdPipe) id: number,
    @Body(new ZodValidationPipe(buyPlayerSchema)) input: BuyPlayerInput,
  ): Promise<PurchaseView> {
    return this.market.buy(id, input);
  }

  @Post(':id/sell')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vende jogador pelo clube atual' })
  sell(@Param('id', ParseResourceIdPipe) id: number): Promise<SaleView> {
    return this.market.sell(id);
  }
}
