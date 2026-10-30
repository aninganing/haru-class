import { CLOSING_SOON_DEFAULT_LIMIT, type ClassCategory, type ClosingSoonResponse } from '@haru/contracts';
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { keys } from '@/lib/query/keys';

export const closingSoonPath = (category?: ClassCategory) => {
  const params = new URLSearchParams({ limit: String(CLOSING_SOON_DEFAULT_LIMIT) });
  if (category) params.set('category', category);
  return `/sessions/closing-soon?${params.toString()}`;
};

/** 이번 주 마감 임박 회차. 카테고리 칩과 같은 필터를 쓴다. */
export const closingSoonQuery = (category?: ClassCategory) =>
  queryOptions({
    queryKey: keys.session.closingSoon(category),
    queryFn: ({ signal }) => api.get<ClosingSoonResponse>(closingSoonPath(category), { signal }),
  });
