import { money } from '../../../common/money/money';
import { CsvTransaction, toTransactionsCsv } from './transactions-csv';

const HEADER =
  'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa';

const PURCHASE: CsvTransaction = {
  createdAt: new Date('2026-11-02T13:15:00.000Z'),
  playerName: 'Meia Lua',
  type: 'COMPRA',
  value: money('37.00'),
  fee: money('1.85'),
  penalty: money('0.00'),
  profit: null,
  cashChange: money('-38.85'),
};

const SALE: CsvTransaction = {
  createdAt: new Date('2026-11-05T19:40:00.000Z'),
  playerName: 'Meia Lua',
  type: 'VENDA',
  value: money('40.00'),
  fee: money('0.30'),
  penalty: money('4.00'),
  profit: money('3.00'),
  cashChange: money('35.70'),
};

function lineOf(fields: Partial<CsvTransaction>): string {
  return toTransactionsCsv([{ ...SALE, ...fields }]).split('\n')[1];
}

describe('toTransactionsCsv', () => {
  it('reproduz o exemplo da RN18, caractere por caractere', () => {
    expect(toTransactionsCsv([SALE, PURCHASE])).toBe(
      `${HEADER}\n` +
        '2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70\n' +
        '2026-11-02T10:15:00-03:00;COMPRA;Meia Lua;37,00;1,85;0,00;;-38,85\n',
    );
  });

  it('sem transações, traz só o cabeçalho, terminado em LF', () => {
    expect(toTransactionsCsv([])).toBe(`${HEADER}\n`);
  });

  it('termina cada linha em LF, sem CR e sem BOM', () => {
    const csv = toTransactionsCsv([SALE, PURCHASE]);

    expect(csv.endsWith('\n')).toBe(true);
    expect(csv).not.toContain('\r');
    expect(csv.charCodeAt(0)).not.toBe(0xfeff);
    expect(csv.split('\n')).toHaveLength(4);
  });

  it('mantém a ordem recebida, que é a do histórico', () => {
    const csv = toTransactionsCsv([PURCHASE, SALE]);

    expect(csv.split('\n')[1]).toMatch(/;COMPRA;/);
    expect(csv.split('\n')[2]).toMatch(/;VENDA;/);
  });

  it.each([
    ['com ponto e vírgula', 'Zé; Lima', '"Zé; Lima"'],
    ['com aspas', 'Zé "Foguete" Lima', '"Zé ""Foguete"" Lima"'],
    ['com aspas e ponto e vírgula', 'A "B"; C', '"A ""B""; C"'],
    ['só com uma aspa', 'Zé" Lima', '"Zé"" Lima"'],
    ['com acentos e hífen', 'Ênio Carvalho-Neto', 'Ênio Carvalho-Neto'],
    ['com vírgula', 'Lima, Zé', 'Lima, Zé'],
  ])('nome %s → %s', (_, playerName, field) => {
    expect(lineOf({ playerName }).split(';').length).toBeGreaterThanOrEqual(8);
    expect(lineOf({ playerName })).toContain(`;VENDA;${field};`);
  });

  it.each([
    ['0.00', '0,00'],
    ['0.05', '0,05'],
    ['1744.14', '1744,14'],
    ['-7.50', '-7,50'],
  ])('escreve o lucro %s como %s', (profit, text) => {
    expect(lineOf({ profit: money(profit) }).split(';')[6]).toBe(text);
  });

  it('deixa o lucro vazio quando é nulo', () => {
    expect(lineOf({ profit: null }).split(';')[6]).toBe('');
  });

  it('escreve a data e a hora no horário de Brasília', () => {
    expect(
      lineOf({ createdAt: new Date('2026-11-06T02:59:59.000Z') }).split(';')[0],
    ).toBe('2026-11-05T23:59:59-03:00');
  });
});
