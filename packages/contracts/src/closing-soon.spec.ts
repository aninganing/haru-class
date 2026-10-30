import { describe, expect, it } from 'vitest';
import {
  CLOSING_SOON_DEFAULT_LIMIT,
  closingSoonQuerySchema,
  closingSoonResponseSchema,
} from './closing-soon';

describe('closingSoonQuerySchema', () => {
  it('limit이 없으면 기본값, 문자열은 숫자로', () => {
    expect(closingSoonQuerySchema.parse({})).toEqual({ limit: CLOSING_SOON_DEFAULT_LIMIT });
    expect(closingSoonQuerySchema.parse({ limit: '5' })).toEqual({ limit: 5 });
  });

  it.each([
    [1, true],
    [20, true],
    [0, false],
    [21, false],
  ])('limit %s → 통과 %s', (limit, ok) => {
    expect(closingSoonQuerySchema.safeParse({ limit }).success).toBe(ok);
  });

  it('category는 목록과 같은 enum만 받는다', () => {
    expect(closingSoonQuerySchema.parse({ category: 'FLOWER' })).toMatchObject({ category: 'FLOWER' });
    expect(closingSoonQuerySchema.safeParse({ category: 'flower' }).success).toBe(false);
  });
});

describe('closingSoonResponseSchema', () => {
  const item = {
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
      thumbnailUrl: null,
    },
  };

  it('빈 목록과 회차 카드를 파싱한다', () => {
    expect(closingSoonResponseSchema.parse({ items: [] })).toEqual({ items: [] });
    expect(closingSoonResponseSchema.parse({ items: [item] })).toEqual({ items: [item] });
  });

  it('잔여 0석(매진)은 마감 임박 응답에 올 수 없다', () => {
    expect(closingSoonResponseSchema.safeParse({ items: [{ ...item, remaining: 0 }] }).success).toBe(false);
  });
});
