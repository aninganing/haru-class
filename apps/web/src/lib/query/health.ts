import type { Health } from '@haru/contracts';
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { keys } from './keys';

export const healthQuery = () =>
  queryOptions({
    queryKey: keys.health(),
    queryFn: () => api.get<Health>('/health'),
    // 폴링 동작 확인용. 탭이 백그라운드로 가면 자동으로 멈춘다.
    refetchInterval: 10_000,
    staleTime: 0,
  });
