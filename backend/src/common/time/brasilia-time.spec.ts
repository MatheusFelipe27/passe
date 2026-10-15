import { formatBrasiliaDateTime } from './brasilia-time';

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
