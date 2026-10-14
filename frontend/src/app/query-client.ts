import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/http-client';

const MAX_RETRIES = 1;

// Recusas da API (4xx) não mudam com outra tentativa; só falhas de rede ou do servidor são repetidas.
function shouldRetry(failureCount: number, error: Error): boolean {
  const isClientError =
    error instanceof ApiError && error.status >= 400 && error.status < 500;
  return !isClientError && failureCount < MAX_RETRIES;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry, refetchOnWindowFocus: false },
  },
});
