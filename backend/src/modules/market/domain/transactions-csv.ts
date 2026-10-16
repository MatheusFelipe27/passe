import { formatMoneyText, Money } from '../../../common/money/money';
import { formatBrasiliaDateTime } from '../../../common/time/brasilia-time';
import { TransactionAmounts } from './transaction-summary';

export interface CsvTransaction extends TransactionAmounts {
  createdAt: Date;
  playerName: string;
}

// RN18: cabeçalho fixo, separador ";" e cada linha terminada em LF, inclusive a última.
const HEADER =
  'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa';
const SEPARATOR = ';';
const LINE_END = '\n';
const NEEDS_QUOTES = /[;"]/;

// RN18: uma linha por transação, na ordem recebida (a do histórico). Sem transações, só o cabeçalho.
export function toTransactionsCsv(transactions: CsvTransaction[]): string {
  const lines = [HEADER, ...transactions.map(toCsvLine)];
  return lines.map((line) => line + LINE_END).join('');
}

function toCsvLine(transaction: CsvTransaction): string {
  return [
    formatBrasiliaDateTime(transaction.createdAt),
    transaction.type,
    quoteName(transaction.playerName),
    amount(transaction.value),
    amount(transaction.fee),
    amount(transaction.penalty),
    transaction.profit === null ? '' : amount(transaction.profit),
    amount(transaction.cashChange),
  ].join(SEPARATOR);
}

// RN18: 2 casas, vírgula decimal e "-" nos negativos.
function amount(value: Money): string {
  return formatMoneyText(value);
}

// RN18: nome com ";" ou aspas vai entre aspas duplas, com cada aspa interna duplicada.
function quoteName(name: string): string {
  return NEEDS_QUOTES.test(name) ? `"${name.replaceAll('"', '""')}"` : name;
}
