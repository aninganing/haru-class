import type { ClosingSoonItem, ClosingSoonResponse } from '@haru/contracts';
import { SAMPLE_THUMBNAIL } from '@/features/class/fixtures/classes';

export function makeClosingSoonItem(overrides: Partial<ClosingSoonItem> = {}): ClosingSoonItem {
  return {
    sessionId: 's1',
    startsAt: '2026-10-31T05:00:00.000Z',
    capacity: 6,
    remaining: 1,
    class: {
      id: 'c1',
      title: '성수 도자기 원데이클래스',
      category: 'CRAFT',
      neighborhood: '성수동',
      price: 45000,
      durationMinutes: 120,
      thumbnailUrl: SAMPLE_THUMBNAIL,
    },
    ...overrides,
  };
}

export function makeClosingSoon(count = 3): ClosingSoonResponse {
  const titles = ['성수 도자기 원데이클래스', '연남 수채화 드로잉', '나만의 향수 블렌딩'];
  return {
    items: Array.from({ length: count }, (_, i) =>
      makeClosingSoonItem({
        sessionId: `s${i + 1}`,
        remaining: (i % 2) + 1,
        startsAt: new Date(Date.UTC(2026, 9, 31 + i, 5)).toISOString(),
        class: { ...makeClosingSoonItem().class, id: `c${i + 1}`, title: titles[i % 3]! + (i >= 3 ? ` ${i + 1}` : '') },
      }),
    ),
  };
}
