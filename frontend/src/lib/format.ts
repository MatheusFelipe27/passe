const integerFormat = new Intl.NumberFormat('pt-BR');

export function formatInteger(value: number): string {
  return integerFormat.format(value);
}

export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? singular : plural;
}
