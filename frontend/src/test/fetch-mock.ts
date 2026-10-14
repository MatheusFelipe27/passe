import { vi } from 'vitest';

export interface MockResponse {
  status?: number;
  body?: unknown;
}

// Substitui o fetch: cada caminho da API (com a query string) devolve a resposta indicada.
export function mockApi(responses: Record<string, MockResponse>) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const path = url.pathname.replace('/api/v1', '') + url.search;
    const response = responses[path] ?? {
      status: 404,
      body: { message: 'Recurso não encontrado.' },
    };
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
