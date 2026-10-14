import { createPlayerSchema } from './create-player.schema';

const validPlayer = {
  name: 'Meia Lua',
  position: 'MEI',
  agility: 85,
  age: 25,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
};

const INTEGER_FIELDS = [
  'agility',
  'age',
  'pace',
  'shooting',
  'passing',
  'dribbling',
  'defending',
  'physical',
  'potential',
] as const;

const ATTRIBUTE_FIELDS = [
  'pace',
  'shooting',
  'passing',
  'dribbling',
  'defending',
  'physical',
] as const;

function isAccepted(body: unknown): boolean {
  return createPlayerSchema.safeParse(body).success;
}

function withFields(fields: Record<string, unknown>): Record<string, unknown> {
  return { ...validPlayer, ...fields };
}

function withoutField(field: string): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(validPlayer).filter(([key]) => key !== field),
  );
}

function withAllAttributes(value: number): Record<string, number> {
  return Object.fromEntries(ATTRIBUTE_FIELDS.map((field) => [field, value]));
}

describe('createPlayerSchema', () => {
  it('aceita o cadastro válido e devolve os dados', () => {
    expect(createPlayerSchema.parse(validPlayer)).toEqual(validPlayer);
  });

  describe('V1: o corpo é um objeto', () => {
    it.each([[[]], ['x'], [10], [true], [null], [undefined]])(
      'recusa %j',
      (body) => {
        expect(isAccepted(body)).toBe(false);
      },
    );
  });

  describe('V6: campos obrigatórios', () => {
    it.each(Object.keys(validPlayer))('recusa sem %s', (field) => {
      expect(isAccepted(withoutField(field))).toBe(false);
    });

    it.each(Object.keys(validPlayer))('recusa %s nulo', (field) => {
      expect(isAccepted(withFields({ [field]: null }))).toBe(false);
    });

    it('recusa o campo enviado fora do snake_case', () => {
      const body = { ...withoutField('agility'), Agility: 85 };

      expect(isAccepted(body)).toBe(false);
    });
  });

  describe('V7: campos controlados pelo sistema', () => {
    it('ignora os campos que não pertencem ao cadastro', () => {
      const body = withFields({
        id: 999,
        base_value: 1,
        market_value: 5,
        overall: 1,
        club_id: 7,
        condition: 'DOENTE',
        cash: 10,
        unknown_field: 'x',
      });

      expect(createPlayerSchema.parse(body)).toEqual(validPlayer);
    });
  });

  describe('name', () => {
    it.each([
      ['  Meia   Zeta ', 'Meia Zeta'],
      ['Meia Lua', 'Meia Lua'],
      ['A B', 'A B'],
      ['Zé Roberto', 'Zé Roberto'],
      ['Lucas "Foguete" Prado', 'Lucas "Foguete" Prado'],
      ['Zé; Lima', 'Zé; Lima'],
      ['Ana-Maria Lima', 'Ana-Maria Lima'],
    ])('aceita "%s" e grava "%s"', (name, expected) => {
      expect(createPlayerSchema.parse(withFields({ name })).name).toBe(
        expected,
      );
    });

    it.each([[123], [true], [['Meia Lua']], [{ first: 'Meia' }]])(
      'recusa o tipo de %j',
      (name) => {
        expect(isAccepted(withFields({ name }))).toBe(false);
      },
    );

    it.each(['', ' ', '     '])('recusa o texto vazio "%s"', (name) => {
      expect(isAccepted(withFields({ name }))).toBe(false);
    });

    it.each(['Meia\tLua', 'Meia Lua\n', '\rMeia Lua', 'Meia\u0000 Lua'])(
      'recusa caractere de controle em %j',
      (name) => {
        expect(isAccepted(withFields({ name }))).toBe(false);
      },
    );

    it.each([
      ['2 caracteres', 'AB', false],
      ['3 caracteres', 'A B', true],
      ['99 caracteres', `A ${'b'.repeat(97)}`, true],
      ['100 caracteres', `A ${'b'.repeat(98)}`, true],
      ['101 caracteres', `A ${'b'.repeat(99)}`, false],
      [
        '100 caracteres depois de normalizar',
        `  A   ${'b'.repeat(98)}  `,
        true,
      ],
      [
        '100 pontos de código fora do plano básico',
        `A ${'𝐛'.repeat(98)}`,
        true,
      ],
      [
        '101 pontos de código fora do plano básico',
        `A ${'𝐛'.repeat(99)}`,
        false,
      ],
    ])('tamanho: %s', (_description, name, expected) => {
      expect(isAccepted(withFields({ name }))).toBe(expected);
    });

    it.each([
      ['Meia', false],
      ['Meia-Lua', false],
      ['Meia -', false],
      ['Meia .', false],
      ['Meia L', true],
      ['Meia Lua Nova', true],
    ])('palavras: "%s" aceito = %s', (name, expected) => {
      expect(isAccepted(withFields({ name }))).toBe(expected);
    });

    it.each(['Meia Lua 2', 'Meia Lua2', 'Meia 0 Lua', '9 Meia Lua'])(
      'recusa dígito em "%s"',
      (name) => {
        expect(isAccepted(withFields({ name }))).toBe(false);
      },
    );
  });

  describe('position', () => {
    it.each(['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'])('aceita %s', (position) => {
      expect(isAccepted(withFields({ position }))).toBe(true);
    });

    it.each(['mei', 'Mei', 'ata', ' MEI', 'MEI ', '', 'VOL', 1, true])(
      'recusa %j',
      (position) => {
        expect(isAccepted(withFields({ position }))).toBe(false);
      },
    );
  });

  describe('V2: tipos dos campos inteiros', () => {
    it.each(INTEGER_FIELDS)('recusa %s como texto', (field) => {
      expect(isAccepted(withFields({ [field]: '50' }))).toBe(false);
    });

    it.each(INTEGER_FIELDS)('recusa %s com parte fracionária', (field) => {
      expect(isAccepted(withFields({ [field]: 50.5 }))).toBe(false);
    });

    it.each(INTEGER_FIELDS)('recusa %s booleano', (field) => {
      expect(isAccepted(withFields({ [field]: true }))).toBe(false);
    });

    it('aceita 50.0 como 50', () => {
      const body: unknown = JSON.parse(
        JSON.stringify(validPlayer).replace('"agility":85', '"agility":50.0'),
      );

      expect(createPlayerSchema.parse(body).agility).toBe(50);
    });
  });

  describe('agility', () => {
    it.each([
      [0, false],
      [1, true],
      [100, true],
      [101, false],
      [-1, false],
    ])('%i aceito = %s', (agility, expected) => {
      expect(isAccepted(withFields({ agility }))).toBe(expected);
    });

    it.each([
      [34, 86, true],
      [34, 100, true],
      [35, 85, true],
      [35, 86, false],
      [35, 100, false],
      [45, 85, true],
      [45, 86, false],
    ])('com %i anos e agilidade %i aceito = %s', (age, agility, expected) => {
      const body = withFields({ age, agility, potential: 82 });

      expect(isAccepted(body)).toBe(expected);
    });
  });

  describe('age', () => {
    it.each([
      [15, false],
      [16, true],
      [32, true],
      [45, false],
      [46, false],
    ])(
      '%i com potencial acima do maior atributo aceito = %s',
      (age, expected) => {
        expect(isAccepted(withFields({ age }))).toBe(expected);
      },
    );

    it.each([
      [33, true],
      [45, true],
      [46, false],
    ])(
      '%i com potencial igual ao maior atributo aceito = %s',
      (age, expected) => {
        expect(isAccepted(withFields({ age, potential: 82 }))).toBe(expected);
      },
    );
  });

  describe('atributos', () => {
    it.each(ATTRIBUTE_FIELDS)('%s vai de 1 a 99', (field) => {
      const others = withAllAttributes(50);

      expect(isAccepted(withFields({ ...others, [field]: 0 }))).toBe(false);
      expect(isAccepted(withFields({ ...others, [field]: 1 }))).toBe(true);
      expect(
        isAccepted(withFields({ ...others, [field]: 99, potential: 99 })),
      ).toBe(true);
      expect(
        isAccepted(withFields({ ...others, [field]: 100, potential: 99 })),
      ).toBe(false);
    });

    it.each([
      [479, { ...withAllAttributes(80), pace: 79 }, true],
      [480, withAllAttributes(80), true],
      [481, { ...withAllAttributes(80), pace: 81 }, false],
    ])('soma %i aceita = %s', (_sum, attributes, expected) => {
      const body = withFields({ ...attributes, potential: 90 });

      expect(isAccepted(body)).toBe(expected);
    });
  });

  describe('potential', () => {
    it.each([
      [0, false],
      [100, false],
      [81, false],
      [82, true],
      [83, true],
      [99, true],
    ])('%i com maior atributo 82 aceito = %s', (potential, expected) => {
      expect(isAccepted(withFields({ potential }))).toBe(expected);
    });

    it.each([
      [32, 81, false],
      [32, 82, true],
      [32, 83, true],
      [33, 81, false],
      [33, 82, true],
      [33, 83, false],
      [45, 82, true],
      [45, 83, false],
    ])(
      'com %i anos e potencial %i (maior atributo 82) aceito = %s',
      (age, potential, expected) => {
        expect(isAccepted(withFields({ age, potential }))).toBe(expected);
      },
    );
  });
});
