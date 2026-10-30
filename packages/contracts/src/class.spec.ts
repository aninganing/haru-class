import { describe, expect, it } from 'vitest';
import {
  CLASS_CATEGORY_LABELS,
  CLASS_DIFFICULTY_LABELS,
  CLASS_LIST_DEFAULT_LIMIT,
  CLASS_MAX_IMAGES,
  classCategorySchema,
  classDetailSchema,
  classDifficultySchema,
  classIdParamSchema,
  classListQuerySchema,
  classListResponseSchema,
} from './class';

describe('classListQuerySchema', () => {
  it('limit이 없으면 기본값을 쓴다', () => {
    expect(classListQuerySchema.parse({})).toEqual({ limit: CLASS_LIST_DEFAULT_LIMIT });
  });

  it('쿼리스트링 문자열 limit을 숫자로 바꾼다', () => {
    expect(classListQuerySchema.parse({ limit: '20', cursor: 'abc' })).toEqual({ limit: 20, cursor: 'abc' });
  });

  it.each([
    [1, true],
    [50, true],
    [0, false],
    [51, false],
    [1.5, false],
    ['abc', false],
  ])('limit %s → 통과 %s', (limit, ok) => {
    expect(classListQuerySchema.safeParse({ limit }).success).toBe(ok);
  });

  it('빈 cursor는 거부한다', () => {
    expect(classListQuerySchema.safeParse({ cursor: '' }).success).toBe(false);
  });

  it('category는 정의된 값만 받는다', () => {
    expect(classListQuerySchema.parse({ category: 'CRAFT' })).toMatchObject({ category: 'CRAFT' });
    expect(classListQuerySchema.safeParse({ category: 'craft' }).success).toBe(false);
    expect(classListQuerySchema.safeParse({ category: '공예' }).success).toBe(false);
  });
});

describe('카테고리·난이도 라벨', () => {
  it('모든 카테고리와 난이도에 한국어 라벨이 있다', () => {
    expect(Object.keys(CLASS_CATEGORY_LABELS).sort()).toEqual([...classCategorySchema.options].sort());
    expect(Object.keys(CLASS_DIFFICULTY_LABELS).sort()).toEqual([...classDifficultySchema.options].sort());
  });
});

describe('classIdParamSchema', () => {
  it('cuid 형식만 통과한다', () => {
    expect(classIdParamSchema.safeParse({ id: 'cmhx0abcd0000a1b2c3d4e5f6' }).success).toBe(true);
    expect(classIdParamSchema.safeParse({ id: '../admin' }).success).toBe(false);
    expect(classIdParamSchema.safeParse({ id: '' }).success).toBe(false);
  });
});

const summary = {
  id: 'c1',
  title: '나만의 향초 만들기',
  summary: '소이왁스로 향초 2개',
  category: 'SCENT',
  tags: ['입문자 추천'],
  neighborhood: '연남동',
  price: 45000,
  durationMinutes: 120,
  thumbnailUrl: null,
  maxCapacity: 6,
  isNew: true,
  nextSessionAt: '2026-11-03T05:00:00.000Z',
};

describe('classListResponseSchema', () => {
  it('썸네일·다음 회차·정원이 없는 항목, 마지막 페이지(nextCursor null)를 파싱한다', () => {
    const body = {
      items: [{ ...summary, nextSessionAt: null, maxCapacity: null, tags: [] }],
      nextCursor: null,
    };
    expect(classListResponseSchema.parse(body)).toEqual(body);
  });

  it('음수 가격, 0분 수업, 0명 정원, 모르는 카테고리는 거부한다', () => {
    const parse = (patch: object) =>
      classListResponseSchema.safeParse({ items: [{ ...summary, ...patch }], nextCursor: null }).success;
    expect(parse({ price: -1 })).toBe(false);
    expect(parse({ durationMinutes: 0 })).toBe(false);
    expect(parse({ maxCapacity: 0 })).toBe(false);
    expect(parse({ category: 'SPORTS' })).toBe(false);
  });
});

describe('classDetailSchema', () => {
  const detail = {
    ...summary,
    isNew: undefined,
    nextSessionAt: undefined,
    description: '산지별 원두를 비교 시음합니다.',
    difficulty: 'INTRO',
    location: '서울 성동구 성수동 123',
    locationNote: '성수역 3번 출구 5분',
    thumbnailUrl: 'https://picsum.photos/seed/1/640/480',
    images: ['https://picsum.photos/seed/1/640/480', 'https://picsum.photos/seed/2/640/480'],
    learnings: ['흙 다루기', '형태 만들기'],
    curriculum: [
      { offsetMinutes: 0, title: '공방 소개' },
      { offsetMinutes: 20, title: '형태 만들기' },
    ],
    inclusions: '재료비, 앞치마 대여',
    host: { name: '흙과손 공방' },
    sessions: [
      {
        id: 's1',
        startsAt: '2026-11-03T05:00:00.000Z',
        endsAt: '2026-11-03T06:30:00.000Z',
        capacity: 4,
        remaining: 0,
        status: 'SOLD_OUT',
      },
    ],
  };
  const { isNew: _isNew, nextSessionAt: _next, ...body } = detail;

  it('회차·이미지·커리큘럼·호스트를 포함한 상세를 파싱한다', () => {
    expect(classDetailSchema.parse(body)).toEqual(body);
  });

  it(`이미지는 ${CLASS_MAX_IMAGES}장까지만 받는다`, () => {
    const images = Array.from({ length: CLASS_MAX_IMAGES + 1 }, (_, i) => `https://picsum.photos/seed/${i}/640/480`);
    expect(classDetailSchema.safeParse({ ...body, images }).success).toBe(false);
  });

  it('응답에 CLOSED 회차가 섞이면 거부한다', () => {
    const session = { ...body.sessions[0], status: 'CLOSED' };
    expect(classDetailSchema.safeParse({ ...body, sessions: [session] }).success).toBe(false);
  });

  it('음수 커리큘럼 시각과 모르는 난이도는 거부한다', () => {
    expect(classDetailSchema.safeParse({ ...body, curriculum: [{ offsetMinutes: -5, title: 'x' }] }).success).toBe(false);
    expect(classDetailSchema.safeParse({ ...body, difficulty: 'EXPERT' }).success).toBe(false);
  });
});
