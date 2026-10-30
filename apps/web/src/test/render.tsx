import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

/** 재시도하지 않는 테스트용 QueryClient. 미리 데이터를 넣어(SSR hydrate 흉내) 렌더링할 때 쓴다. */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });

/** 테스트마다 새 QueryClient. 실패 시 재시도하지 않아 에러 상태를 바로 확인할 수 있다. */
export function renderWithQuery(ui: ReactElement, options: { queryClient?: QueryClient } = {}) {
  const queryClient = options.queryClient ?? createTestQueryClient();
  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
}
