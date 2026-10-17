const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar à API. Verifique se ela está no ar.';

export type QueryParams = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: QueryParams;
  body?: unknown;
}

// Erro de uma chamada à API, com o `message` que ela devolveu quando houver.
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await send(path, options);
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export interface DownloadedFile {
  content: string;
  fileName: string | undefined;
}

const FILE_NAME = /filename="?([^";]+)"?/;

// Arquivo devolvido pela API (como o CSV), com o nome sugerido no Content-Disposition.
export async function requestFile(
  path: string,
  options: RequestOptions = {},
): Promise<DownloadedFile> {
  const response = await send(path, options);
  const disposition = response.headers.get('Content-Disposition') ?? '';
  return {
    content: await response.text(),
    fileName: FILE_NAME.exec(disposition)?.[1],
  };
}

// Envia o pedido; sem resposta, ou com resposta de erro, lança ApiError com o message da API.
async function send(
  path: string,
  { method = 'GET', query, body }: RequestOptions,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers:
        body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  }
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  return response;
}

function buildUrl(path: string, query: QueryParams = {}): string {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(name, String(value));
    }
  }
  const search = params.toString();
  return `${API_URL}${path}${search ? `?${search}` : ''}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string' &&
      body.message.length > 0
    ) {
      return body.message;
    }
  } catch {
    // O corpo não é JSON: cai na mensagem genérica abaixo.
  }
  return `A API respondeu com o erro ${response.status}.`;
}
