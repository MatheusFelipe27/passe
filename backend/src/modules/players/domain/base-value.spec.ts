import { calculateBaseValue } from './base-value';

describe('calculateBaseValue', () => {
  it.each([
    [75, 86, 25, '40.00'],
    [60, 70, 30, '10.00'],
    [61, 70, 30, '12.00'],
    [76, 80, 22, '46.00'],
    [85, 92, 27, '100.00'],
    [83, 88, 27, '88.00'],
    [43, 55, 36, '1.50'],
    [99, 99, 30, '184.00'],
  ])(
    'overall %i, potencial %i e %i anos → %s',
    (overall, potential, age, expected) => {
      const baseValue = calculateBaseValue({ overall, potential, age });

      expect(baseValue.toFixed(2)).toBe(expected);
    },
  );

  it.each([
    [70, 84, 21, '34.20'],
    [70, 84, 22, '30.00'],
    [85, 99, 20, '114.00'],
    [45, 90, 18, '3.63'],
  ])(
    'jovem promessa só até 21 anos: overall %i, potencial %i e %i anos → %s',
    (overall, potential, age, expected) => {
      const baseValue = calculateBaseValue({ overall, potential, age });

      expect(baseValue.toFixed(2)).toBe(expected);
    },
  );

  it.each([
    [70, 70, 21, '30.00'],
    [70, 71, 21, '30.30'],
    [70, 99, 16, '38.70'],
    [45, 90, 21, '3.63'],
    [45, 89, 21, '3.60'],
    [45, 88, 21, '3.58'],
  ])(
    'multiplica pelo potencial e arredonda uma vez: overall %i, potencial %i e %i anos → %s',
    (overall, potential, age, expected) => {
      const baseValue = calculateBaseValue({ overall, potential, age });

      expect(baseValue.toFixed(2)).toBe(expected);
    },
  );

  it.each([
    [75, 80, 30, '40.00'],
    [76, 80, 30, '46.00'],
    [98, 99, 30, '178.00'],
  ])(
    'limites da última faixa: overall %i, potencial %i e %i anos → %s',
    (overall, potential, age, expected) => {
      const baseValue = calculateBaseValue({ overall, potential, age });

      expect(baseValue.toFixed(2)).toBe(expected);
    },
  );

  it.each([
    [1, 99, 16, '1.00'],
    [40, 66, 36, '1.00'],
    [41, 41, 30, '1.00'],
    [42, 42, 30, '1.00'],
    [43, 43, 30, '1.50'],
    [41, 99, 21, '1.00'],
    [42, 99, 21, '1.57'],
  ])(
    'piso de 1,00: overall %i, potencial %i e %i anos → %s',
    (overall, potential, age, expected) => {
      const baseValue = calculateBaseValue({ overall, potential, age });

      expect(baseValue.toFixed(2)).toBe(expected);
    },
  );
});
