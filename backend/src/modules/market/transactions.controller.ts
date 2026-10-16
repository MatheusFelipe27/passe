import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ParseResourceIdPipe } from '../../common/pipes/parse-resource-id.pipe';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiQueryFromSchema } from '../../common/validation/open-api';
import { listTransactionsQuerySchema } from './dto/list-transactions.query';
import type { ListTransactionsQuery } from './dto/list-transactions.query';
import { TransactionHistoryView } from './market.view';
import { TransactionsService } from './transactions.service';

const CSV_CONTENT_TYPE = 'text/csv; charset=utf-8';

@ApiTags('Mercado')
@Controller('clubs')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Histórico de transações do clube, com o resumo' })
  @ApiQueryFromSchema(listTransactionsQuerySchema)
  history(
    @Param('id', ParseResourceIdPipe) id: number,
    @Query(new ZodValidationPipe(listTransactionsQuerySchema))
    query: ListTransactionsQuery,
  ): Promise<TransactionHistoryView> {
    return this.transactions.history(id, query);
  }

  // RN18: o CSV sai como texto puro em UTF-8, sem BOM; as recusas continuam em JSON.
  @Get(':id/transactions/export')
  @ApiOperation({ summary: 'Histórico de transações do clube em CSV' })
  @ApiProduces('text/csv')
  @ApiQueryFromSchema(listTransactionsQuerySchema)
  async exportCsv(
    @Param('id', ParseResourceIdPipe) id: number,
    @Query(new ZodValidationPipe(listTransactionsQuerySchema))
    query: ListTransactionsQuery,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const file = await this.transactions.exportCsv(id, query);
    response.attachment(file.fileName);
    response.type(CSV_CONTENT_TYPE);
    return file.content;
  }
}
