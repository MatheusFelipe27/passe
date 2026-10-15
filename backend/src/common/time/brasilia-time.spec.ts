import { formatBrasiliaDateTime, parseBrasiliaDateTime } from './brasilia-time';

describe('formatBrasiliaDateTime', () => {
  it.each([
    ['2027-03-02T13:15:00.000Z', '2027-03-02T10:15:00-03:00'],
    ['2026-11-05T19:40:07.900Z', '2026-11-05T16:40:07-03:00'],
    ['2026-11-06T02:59:59.000Z', '2026-11-05T23:59:59-03:00'],
    ['2026-11-06T03:00:00.000Z', '2026-11-06T00:00:00-03:00'],
    ['2027-01-01T02:30:00.000Z', '2026-12-31T23:30:00-03:00'],
    ['2028-03-01T02:00:00.000Z', '2028-02-29T23:00:00-03:00'],
  ])('%s vira %s', (instant, expected) => {
    expect(formatBrasiliaDateTime(new Date(instant))).toBe(expected);
  });
});

describe('parseBrasiliaDateTime', () => {
  it.each([
    ['2027-03-02T10:15-03:00', '2027-03-02T13:15:00.000Z'],
    ['2027-03-02T00:00-03:00', '2027-03-02T03:00:00.000Z'],
    ['2027-03-02T23:59-03:00', '2027-03-03T02:59:00.000Z'],
    ['2026-12-31T23:30-03:00', '2027-01-01T02:30:00.000Z'],
    ['2027-01-31T10:00-03:00', '2027-01-31T13:00:00.000Z'],
    ['2027-04-30T10:00-03:00', '2027-04-30T13:00:00.000Z'],
    ['2028-02-29T10:00-03:00', '2028-02-29T13:00:00.000Z'],
    ['2000-02-29T10:00-03:00', '2000-02-29T13:00:00.000Z'],
    ['0050-01-01T00:00-03:00', '0050-01-01T03:00:00.000Z'],
  ])('lê %s como o instante %s', (text, instant) => {
    expect(parseBrasiliaDateTime(text)?.toISOString()).toBe(instant);
  });

  it('devolve o mesmo texto ao formatar o instante lido', () => {
    const instant = parseBrasiliaDateTime('2027-03-02T10:15-03:00');

    expect(formatBrasiliaDateTime(instant!)).toBe('2027-03-02T10:15:00-03:00');
  });

  it.each([
    ['sem o fuso', '2027-03-02T10:15'],
    ['com Z', '2027-03-02T13:15Z'],
    ['com outro fuso', '2027-03-02T10:15-02:00'],
    ['com +03:00', '2027-03-02T10:15+03:00'],
    ['com segundos', '2027-03-02T10:15:00-03:00'],
    ['com milissegundos', '2027-03-02T10:15:00.000-03:00'],
    ['com espaço no lugar do T', '2027-03-02 10:15-03:00'],
    ['com t minúsculo', '2027-03-02t10:15-03:00'],
    ['só a data', '2027-03-02'],
    ['no formato brasileiro', '02/03/2027 10:15'],
    ['com mês de um dígito', '2027-3-02T10:15-03:00'],
    ['com hora de um dígito', '2027-03-02T9:15-03:00'],
    ['com espaço no fim', '2027-03-02T10:15-03:00 '],
    ['vazio', ''],
  ])('recusa o formato %s', (_, text) => {
    expect(parseBrasiliaDateTime(text)).toBeNull();
  });

  it.each([
    ['30 de fevereiro', '2027-02-30T10:15-03:00'],
    ['29 de fevereiro fora de ano bissexto', '2027-02-29T10:15-03:00'],
    ['29 de fevereiro em 1900', '1900-02-29T10:15-03:00'],
    ['31 de abril', '2027-04-31T10:15-03:00'],
    ['32 de janeiro', '2027-01-32T10:15-03:00'],
    ['dia 00', '2027-01-00T10:15-03:00'],
    ['mês 00', '2027-00-10T10:15-03:00'],
    ['mês 13', '2027-13-10T10:15-03:00'],
    ['24:00', '2027-03-02T24:00-03:00'],
    ['minuto 60', '2027-03-02T10:60-03:00'],
  ])('recusa a data ou hora inexistente: %s', (_, text) => {
    expect(parseBrasiliaDateTime(text)).toBeNull();
  });
});
