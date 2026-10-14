export interface RangeValue {
  min?: string;
  max?: string;
}

export function describeRange(
  value: RangeValue,
  format: (value: string) => string,
): string | undefined {
  if (value.min && value.max) {
    return `${format(value.min)} a ${format(value.max)}`;
  }
  if (value.min) {
    return `a partir de ${format(value.min)}`;
  }
  if (value.max) {
    return `até ${format(value.max)}`;
  }
  return undefined;
}
