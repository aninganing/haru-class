import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { HealthStatus } from '@/features/health/components/HealthStatus';
import { getQueryClient } from '@/lib/query/get-query-client';
import { healthQuery } from '@/features/health/api/queries';

export const metadata: Metadata = { title: '시스템 상태' };

export default async function StatusPage() {
  const queryClient = getQueryClient();
  // 실패해도 페이지는 그리고, 클라이언트에서 다시 시도하게 둔다.
  await queryClient.prefetchQuery(healthQuery());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <h1 className="text-500 font-bold">시스템 상태</h1>
      <HealthStatus />
    </HydrationBoundary>
  );
}
