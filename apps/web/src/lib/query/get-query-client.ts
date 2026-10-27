import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // SSR로 받은 데이터를 hydrate 직후 바로 다시 요청하지 않도록 한다.
        staleTime: 30_000,
      },
      dehydrate: {
        // 서버에서 아직 진행 중인 prefetch도 클라이언트로 넘긴다 (streaming).
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });

let browserQueryClient: QueryClient | undefined;

/** 서버에서는 요청마다 새로 만들고, 브라우저에서는 하나를 재사용한다. */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
