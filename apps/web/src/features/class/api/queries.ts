import { CLASS_LIST_DEFAULT_LIMIT, type ClassCategory, type ClassListResponse } from '@haru/contracts';
import { infiniteQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { keys } from '@/lib/query/keys';

export const classListPath = (cursor: string | null, category?: ClassCategory) => {
  const params = new URLSearchParams({ limit: String(CLASS_LIST_DEFAULT_LIMIT) });
  if (category) params.set('category', category);
  if (cursor) params.set('cursor', cursor);
  return `/classes?${params.toString()}`;
};

/** 새로 열린 클래스 목록 (최신순, 커서 기반 무한 스크롤). 서버 prefetch와 클라이언트가 같이 쓴다. */
export const classListInfiniteQuery = (category?: ClassCategory) =>
  infiniteQueryOptions({
    queryKey: keys.class.list(category),
    queryFn: ({ pageParam, signal }) =>
      api.get<ClassListResponse>(classListPath(pageParam, category), { signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
