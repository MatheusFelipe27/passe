import { z } from 'zod';
import { idParam } from '../../../common/validation/query-params';
import {
  TRANSACTION_TYPES,
  TransactionType,
} from '../domain/transaction-summary';

const isTransactionType = (value: string): value is TransactionType =>
  (TRANSACTION_TYPES as readonly string[]).includes(value);

// RN17: um ou mais tipos, separados por vírgula, sem espaços e sem repetir (COMPRA,venda → 400).
const typeParam = z.string().transform((value, context) => {
  const types = value.split(',');
  if (!types.every(isTransactionType) || new Set(types).size !== types.length) {
    context.addIssue({
      code: 'custom',
      message: `deve ter um ou mais de ${TRANSACTION_TYPES.join(', ')}, separados por vírgula, sem espaços e sem repetir`,
    });
    return z.NEVER;
  }
  return types;
});

export const listTransactionsQuerySchema = z
  .object({
    type: typeParam.optional(),
    player_id: idParam().optional(),
  })
  .transform((query) => ({
    types: query.type,
    playerId: query.player_id,
  }));

export type ListTransactionsQuery = z.output<
  typeof listTransactionsQuerySchema
>;
