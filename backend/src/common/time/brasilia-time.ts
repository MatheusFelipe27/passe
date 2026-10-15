export const DAY_MS = 24 * 60 * 60 * 1000;

const BRASILIA_OFFSET_MS = -3 * 60 * 60 * 1000;
const BRASILIA_OFFSET_HOURS = 3;

// RN01: data e hora enviadas à API, sempre no horário de Brasília, sem segundos.
const INPUT_FORMAT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})-03:00$/;

// RN01: as respostas trazem data e hora no horário de Brasília, sempre -03:00.
export function formatBrasiliaDateTime(instant: Date): string {
  const local = new Date(instant.getTime() + BRASILIA_OFFSET_MS);
  const pad = (value: number) => String(value).padStart(2, '0');
  const date = `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
  const time = `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;
  return `${date}T${time}-03:00`;
}

// RN01: só AAAA-MM-DDTHH:MM-03:00; data ou hora inexistente é recusada, nunca ajustada.
export function parseBrasiliaDateTime(text: string): Date | null {
  const match = INPUT_FORMAT.exec(text);
  if (!match) {
    return null;
  }
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month) ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }
  return utcInstant(year, month - 1, day, hour + BRASILIA_OFFSET_HOURS, minute);
}

function daysInMonth(year: number, month: number): number {
  return utcInstant(year, month, 0, 0, 0).getUTCDate();
}

// setUTCFullYear em vez de Date.UTC, que leria os anos de 0 a 99 como 1900 a 1999.
function utcInstant(
  year: number,
  monthIndex: number,
  day: number,
  hours: number,
  minutes: number,
): Date {
  const instant = new Date(0);
  instant.setUTCFullYear(year, monthIndex, day);
  instant.setUTCHours(hours, minutes, 0, 0);
  return instant;
}
