import { listPlayersQuerySchema } from './list-players.query';

function parse(query: Record<string, unknown>) {
  return listPlayersQuerySchema.safeParse(query);
}

function isAccepted(query: Record<string, unknown>): boolean {
  return parse(query).success;
}

describe('listPlayersQuerySchema', () => {
  it('usa os padrões sem parâmetros', () => {
    expect(listPlayersQuerySchema.parse({})).toEqual({
      sort: ['name'],
      page: 1,
      limit: 10,
    });
  });

  it('ignora parâmetros com nome fora da tabela', () => {
    expect(
      listPlayersQuerySchema.parse({ coach: 'x', Position: 'MEI' }),
    ).toEqual({ sort: ['name'], page: 1, limit: 10 });
  });

  it.each([
    'search',
    'position',
    'condition',
    'free',
    'club_id',
    'min_age',
    'max_age',
    'min_value',
    'max_value',
    'sort',
    'page',
    'limit',
  ])('recusa %s presente e vazio', (name) => {
    expect(isAccepted({ [name]: '' })).toBe(false);
  });

  it.each(['search', 'position', 'page'])('recusa %s repetido', (name) => {
    expect(isAccepted({ [name]: ['MEI', 'ATA'] })).toBe(false);
  });

  describe('search', () => {
    it.each([
      ['lu', 'lu'],
      ['  meia   lua ', 'meia lua'],
      ['a'.repeat(100), 'a'.repeat(100)],
    ])('aceita %j como %j', (search, expected) => {
      expect(listPlayersQuerySchema.parse({ search }).search).toBe(expected);
    });

    it.each(['l', '  l  ', '   ', 'a'.repeat(101), 'meia\tlua'])(
      'recusa %j',
      (search) => {
        expect(isAccepted({ search })).toBe(false);
      },
    );
  });

  describe('listas', () => {
    it.each([
      ['position', 'GOL'],
      ['position', 'ATA'],
      ['condition', 'APTO'],
      ['condition', 'MAL_CONDICIONADO'],
    ])('aceita %s=%s', (name, value) => {
      expect(isAccepted({ [name]: value })).toBe(true);
    });

    it.each([
      ['position', 'mei'],
      ['position', 'Mei'],
      ['condition', 'apto'],
      ['condition', 'DOENTE '],
    ])('recusa %s=%j', (name, value) => {
      expect(isAccepted({ [name]: value })).toBe(false);
    });
  });

  describe('free e club_id', () => {
    it.each([
      [{ free: 'true' }, true],
      [{ free: 'false' }, false],
    ])('converte %j', (query, expected) => {
      expect(listPlayersQuerySchema.parse(query).free).toBe(expected);
    });

    it.each(['TRUE', 'True', '1', 'yes'])('recusa free=%s', (free) => {
      expect(isAccepted({ free })).toBe(false);
    });

    it.each([
      [{ free: 'true', club_id: '3' }, false],
      [{ free: 'false', club_id: '3' }, true],
      [{ club_id: '3' }, true],
    ])('combinação %j aceita = %s', (query, expected) => {
      expect(isAccepted(query)).toBe(expected);
    });
  });

  describe('inteiros', () => {
    it.each([
      ['club_id', '1', 1],
      ['club_id', '2147483647', 2147483647],
      ['page', '1', 1],
      ['page', '9999', 9999],
      ['limit', '1', 1],
      ['limit', '50', 50],
      ['min_age', '16', 16],
      ['max_age', '45', 45],
    ])('aceita %s=%s', (name, value, expected) => {
      const result = listPlayersQuerySchema.parse({ [name]: value });
      const parsed = {
        club_id: result.clubId,
        page: result.page,
        limit: result.limit,
        min_age: result.age?.min,
        max_age: result.age?.max,
      }[name];

      expect(parsed).toBe(expected);
    });

    it.each([
      ['club_id', '0'],
      ['club_id', '-1'],
      ['club_id', '01'],
      ['club_id', '+1'],
      ['club_id', '1.0'],
      ['club_id', '1e3'],
      ['club_id', 'abc'],
      ['page', '0'],
      ['page', '1.5'],
      ['limit', '0'],
      ['limit', '51'],
      ['min_age', '15'],
      ['min_age', '46'],
      ['max_age', '15'],
      ['max_age', '46'],
      ['min_age', '016'],
    ])('recusa %s=%s', (name, value) => {
      expect(isAccepted({ [name]: value })).toBe(false);
    });
  });

  describe('faixa de idade', () => {
    it.each([
      [{ min_age: '20' }, { min: 20, max: 45 }],
      [{ max_age: '30' }, { min: 16, max: 30 }],
      [
        { min_age: '25', max_age: '25' },
        { min: 25, max: 25 },
      ],
      [
        { min_age: '20', max_age: '30' },
        { min: 20, max: 30 },
      ],
    ])('%j vira %j', (query, expected) => {
      expect(listPlayersQuerySchema.parse(query).age).toEqual(expected);
    });

    it('recusa min_age maior que max_age', () => {
      expect(isAccepted({ min_age: '31', max_age: '30' })).toBe(false);
    });
  });

  describe('faixa de valor de mercado', () => {
    it.each([
      ['0', '0.00'],
      ['10', '10.00'],
      ['10.5', '10.50'],
      ['10.55', '10.55'],
      ['0.5', '0.50'],
      ['550', '550.00'],
      ['550.00', '550.00'],
    ])('aceita min_value=%s', (value, expected) => {
      const result = listPlayersQuerySchema.parse({ min_value: value });

      expect(result.marketValue?.min.toFixed(2)).toBe(expected);
      expect(result.marketValue?.max.toFixed(2)).toBe('550.00');
    });

    it.each([
      '550.01',
      '551',
      '-1',
      '+1',
      '10,5',
      '10.555',
      '1e2',
      '010',
      '00.5',
      '.5',
      '10.',
      'abc',
    ])('recusa min_value=%s', (value) => {
      expect(isAccepted({ min_value: value })).toBe(false);
    });

    it.each([
      [{ min_value: '10.5', max_value: '10.5' }, true],
      [{ min_value: '10.5', max_value: '10.49' }, false],
      [{ min_value: '10.49', max_value: '10.5' }, true],
    ])('combinação %j aceita = %s', (query, expected) => {
      expect(isAccepted(query)).toBe(expected);
    });

    it('usa 0 quando só o máximo vem', () => {
      const result = listPlayersQuerySchema.parse({ max_value: '30' });

      expect(result.marketValue?.min.toFixed(2)).toBe('0.00');
    });
  });

  describe('sort', () => {
    it.each([
      ['name', ['name']],
      ['value_asc', ['value_asc']],
      ['value_desc', ['value_desc']],
      ['age_asc', ['age_asc']],
      ['age_desc', ['age_desc']],
      ['position', ['position']],
      ['position,value_desc', ['position', 'value_desc']],
      ['age_asc,name', ['age_asc', 'name']],
    ])('aceita %s', (sort, expected) => {
      expect(listPlayersQuerySchema.parse({ sort }).sort).toEqual(expected);
    });

    it.each([
      'POSITION',
      'nome',
      'value',
      'value_asc,value_desc',
      'age_asc,age_desc',
      'name,name',
      'position, name',
      'position,',
      ',name',
      'name,age_asc,value_desc',
    ])('recusa %j', (sort) => {
      expect(isAccepted({ sort })).toBe(false);
    });
  });
});
