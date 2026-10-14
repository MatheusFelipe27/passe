const integerFormat = new Intl.NumberFormat('pt-BR');

const moneyFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatInteger(value: number): string {
  return integerFormat.format(value);
}

// Valores em moedas: sempre 2 casas e vírgula decimal (1.744,14).
export function formatMoney(value: number): string {
  return moneyFormat.format(value);
}

export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? singular : plural;
}
