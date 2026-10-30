import type { ClassCategory } from '@haru/contracts';

/** 카테고리 필터가 없을 때(전체)의 키 값 */
const ALL = 'ALL';

/** 쿼리 키는 여기서만 만든다. 무효화할 때 같은 함수를 써서 키가 어긋나지 않게 한다. */
export const keys = {
  health: () => ['health'] as const,
  class: {
    all: () => ['class'] as const,
    /** 모든 카테고리의 목록 (무효화 prefix) */
    lists: () => ['class', 'list'] as const,
    list: (category?: ClassCategory) => ['class', 'list', { category: category ?? ALL }] as const,
  },
  session: {
    all: () => ['session'] as const,
    closingSoon: (category?: ClassCategory) => ['session', 'closing-soon', { category: category ?? ALL }] as const,
  },
};
