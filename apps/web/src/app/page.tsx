import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { HealthStatus } from '@/components/HealthStatus';
import { getQueryClient } from '@/lib/query/get-query-client';
import { healthQuery } from '@/lib/query/health';

export default async function HomePage() {
  const queryClient = getQueryClient();
  // 실패해도 페이지는 그리고, 클라이언트에서 다시 시도하게 둔다.
  await queryClient.prefetchQuery(healthQuery());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <h1>하루클래스</h1>
      <HealthStatus />
    </HydrationBoundary>
  );
}
