import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/api/query-keys';
import { mockApi } from '@/test/fetch-mock';
import { usePlayMatch } from './use-league';

function setup() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(queryKeys.matches.list(), []);
  queryClient.setQueryData(queryKeys.matches.list(2), []);
  queryClient.setQueryData(queryKeys.standings.all, []);
  queryClient.setQueryData(queryKeys.clubs.detail('1'), {});
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => usePlayMatch(), { wrapper });
  const isInvalidated = (key: readonly unknown[]) =>
    queryClient.getQueryState(key)?.isInvalidated;
  return { result, isInvalidated };
}

describe('usePlayMatch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('depois de jogar, o histórico (com e sem filtro) e a classificação são rebuscados; o clube não', async () => {
    mockApi({ '/matches': { status: 201, body: { id: 1 } } });
    const { result, isInvalidated } = setup();

    await act(() =>
      result.current.mutateAsync({ home_club_id: 1, away_club_id: 2 }),
    );

    expect(isInvalidated(queryKeys.matches.list())).toBe(true);
    expect(isInvalidated(queryKeys.matches.list(2))).toBe(true);
    expect(isInvalidated(queryKeys.standings.all)).toBe(true);
    expect(isInvalidated(queryKeys.clubs.detail('1'))).toBe(false);
  });

  it('partida recusada não invalida nada', async () => {
    mockApi({
      '/matches': { status: 409, body: { message: 'Escalação incompleta.' } },
    });
    const { result, isInvalidated } = setup();

    await act(() =>
      expect(
        result.current.mutateAsync({ home_club_id: 1, away_club_id: 2 }),
      ).rejects.toThrow('Escalação incompleta.'),
    );

    expect(isInvalidated(queryKeys.matches.list())).toBe(false);
    expect(isInvalidated(queryKeys.standings.all)).toBe(false);
  });
});
