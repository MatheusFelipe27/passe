import { vi } from 'vitest';

export interface MockResponse {
  status?: number;
  body?: unknown;
  // Atraso da resposta, para simular um pedido em andamento (como no clique duplo).
  delayMs?: number;
}

type Handler = (url: URL, init: RequestInit) => MockResponse | undefined;

const NOT_FOUND: MockResponse = {
  status: 404,
  body: { message: 'Recurso não encontrado.' },
};

// Substitui o fetch: cada caminho da API (com a query string) devolve a resposta indicada.
export function mockApi(responses: Record<string, MockResponse>) {
  return mockApiWith((url) => responses[apiPath(url) + url.search]);
}

// Substitui o fetch por uma função que decide a resposta a partir da URL pedida.
export function mockApiWith(handler: Handler) {
  const fetchMock = vi.fn(
    (input: RequestInfo | URL, init: RequestInit = {}) => {
      const response = handler(new URL(String(input)), init) ?? NOT_FOUND;
      const reply = () =>
        new Response(
          response.body === undefined ? null : JSON.stringify(response.body),
          {
            status: response.status ?? 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      return new Promise<Response>((resolve) =>
        setTimeout(() => resolve(reply()), response.delayMs ?? 0),
      );
    },
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function apiPath(url: URL): string {
  return url.pathname.replace('/api/v1', '');
}

// URLs pedidas à API até agora, para conferir os query params enviados pela tela.
export function requestedUrls(fetchMock: ReturnType<typeof vi.fn>): URL[] {
  return fetchMock.mock.calls.map(([input]) => new URL(String(input)));
}

export interface SentRequest {
  method: string;
  path: string;
  body: unknown;
}

// Pedidos que alteram dados (POST, PUT, PATCH e DELETE), com o corpo já convertido de JSON.
export function sentChanges(
  fetchMock: ReturnType<typeof vi.fn>,
): SentRequest[] {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const options = (init ?? {}) as RequestInit;
      return {
        method: options.method ?? 'GET',
        path: apiPath(new URL(String(input))),
        body:
          typeof options.body === 'string'
            ? (JSON.parse(options.body) as unknown)
            : undefined,
      };
    })
    .filter((request) => request.method !== 'GET');
}
