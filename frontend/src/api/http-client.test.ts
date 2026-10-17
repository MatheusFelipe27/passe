import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '@/test/fetch-mock';
import { ApiError, request, requestFile } from './http-client';

describe('request', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devolve o corpo JSON da resposta', async () => {
    mockApi({ '/clubs': { body: [{ id: 1 }] } });

    await expect(request('/clubs')).resolves.toEqual([{ id: 1 }]);
  });

  it('monta a query string só com os parâmetros definidos', async () => {
    const fetchMock = mockApi({ '/players?free=true&limit=1': { body: {} } });

    await request('/players', {
      query: { free: true, limit: 1, position: undefined },
    });

    expect(String(fetchMock.mock.calls[0][0])).toMatch(
      /\/players\?free=true&limit=1$/,
    );
  });

  it('envia o corpo como JSON', async () => {
    const fetchMock = mockApi({ '/clubs': { status: 201, body: { id: 1 } } });

    await request('/clubs', { method: 'POST', body: { name: 'Águias FC' } });

    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"name":"Águias FC"}');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('devolve undefined na resposta 204, sem corpo', async () => {
    mockApi({ '/players/1': { status: 204 } });

    await expect(
      request('/players/1', { method: 'DELETE' }),
    ).resolves.toBeUndefined();
  });

  it.each([
    [409, 'O custo da compra passa do limite de 50% do caixa.'],
    [404, 'Jogador não encontrado.'],
    [400, 'age: deve ser no mínimo 16'],
  ])('lança ApiError %i com o message da API', async (status, message) => {
    mockApi({ '/players': { status, body: { message } } });

    await expect(request('/players')).rejects.toEqual(
      new ApiError(message, status),
    );
  });

  it('usa uma mensagem genérica quando o erro não traz message', async () => {
    mockApi({ '/players': { status: 500, body: {} } });

    await expect(request('/players')).rejects.toThrow(
      'A API respondeu com o erro 500.',
    );
  });

  it('avisa quando a API está fora do ar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('falhou')));

    await expect(request('/players')).rejects.toEqual(
      new ApiError(
        'Não foi possível conectar à API. Verifique se ela está no ar.',
        0,
      ),
    );
  });
});

describe('requestFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const CSV = 'data_hora;tipo\n2026-11-05T16:40:00-03:00;VENDA\n';

  it('devolve o texto como veio e o nome do arquivo sugerido pela API', async () => {
    mockApi({
      '/clubs/1/transactions/export?type=VENDA': {
        text: CSV,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="transacoes-AGU.csv"',
        },
      },
    });

    await expect(
      requestFile('/clubs/1/transactions/export', { query: { type: 'VENDA' } }),
    ).resolves.toEqual({ content: CSV, fileName: 'transacoes-AGU.csv' });
  });

  it.each([
    ['sem aspas', 'attachment; filename=historico.csv', 'historico.csv'],
    ['sem o cabeçalho', undefined, undefined],
  ])('lê o nome do arquivo %s', async (_, disposition, fileName) => {
    mockApi({
      '/arquivo': {
        text: CSV,
        headers: disposition ? { 'Content-Disposition': disposition } : {},
      },
    });

    expect((await requestFile('/arquivo')).fileName).toBe(fileName);
  });

  it('lê a recusa em JSON, com o message da API', async () => {
    mockApi({
      '/clubs/1/transactions/export?type=compra': {
        status: 400,
        body: { message: 'type: deve ter um ou mais de COMPRA, VENDA' },
      },
    });

    await expect(
      requestFile('/clubs/1/transactions/export', {
        query: { type: 'compra' },
      }),
    ).rejects.toEqual(
      new ApiError('type: deve ter um ou mais de COMPRA, VENDA', 400),
    );
  });
});
