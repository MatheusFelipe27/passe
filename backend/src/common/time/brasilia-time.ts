const BRASILIA_OFFSET_MS = -3 * 60 * 60 * 1000;

// RN01: as respostas trazem data e hora no horário de Brasília, sempre -03:00.
export function formatBrasiliaDateTime(instant: Date): string {
  const local = new Date(instant.getTime() + BRASILIA_OFFSET_MS);
  const pad = (value: number) => String(value).padStart(2, '0');
  const date = `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
  const time = `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;
  return `${date}T${time}-03:00`;
}
