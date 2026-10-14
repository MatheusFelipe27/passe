import { vi } from 'vitest';

export interface MockResponse {
  status?: number;
  body?: unknown;
}

type Handler = (url: URL) => MockResponse | undefined;

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
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const response = handler(new URL(String(input))) ?? NOT_FOUND;
    return Promise.resolve(
      new Response(
        response.body === undefined ? null : JSON.stringify(response.body),
        {
          status: response.status ?? 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
  });
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
