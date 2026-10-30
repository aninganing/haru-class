import type { ClassDetail, ClassListResponse, ClassSummary, SessionSummary } from '@haru/contracts';

/** 테스트·스토리용 이미지. data URI라 네트워크와 next.config의 remotePatterns에 의존하지 않는다. */
const svg = (fill: string, accent: string) =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="${fill}"/><circle cx="320" cy="240" r="120" fill="${accent}"/></svg>`,
  );

export const SAMPLE_IMAGES = [svg('#c7d2fe', '#818cf8'), svg('#fde68a', '#f59e0b'), svg('#bbf7d0', '#22c55e')];
export const SAMPLE_THUMBNAIL = SAMPLE_IMAGES[0]!;

export function makeClassSummary(overrides: Partial<ClassSummary> = {}): ClassSummary {
  return {
    id: 'c1',
    title: '성수 도자기 원데이클래스',
    summary: '흙을 처음 만지는 분도 두 시간이면 나만의 머그컵을 완성해요.',
    category: 'CRAFT',
    tags: ['입문자 추천'],
    neighborhood: '성수동',
    price: 45000,
    durationMinutes: 120,
    thumbnailUrl: SAMPLE_THUMBNAIL,
    maxCapacity: 6,
    isNew: true,
    nextSessionAt: '2026-10-31T05:00:00.000Z',
    ...overrides,
  };
}

/** start부터 count개의 클래스로 한 페이지를 만든다. id는 c{n}, 제목은 "클래스 n". */
export function makeClassPage(start: number, count: number, nextCursor: string | null): ClassListResponse {
  return {
    items: Array.from({ length: count }, (_, i) => {
      const n = start + i;
      return makeClassSummary({ id: `c${n}`, title: `클래스 ${n}` });
    }),
    nextCursor,
  };
}

export function makeSession(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: 's1',
    startsAt: '2026-10-31T05:00:00.000Z',
    endsAt: '2026-10-31T07:00:00.000Z',
    capacity: 6,
    remaining: 1,
    status: 'OPEN',
    ...overrides,
  };
}

export function makeClassDetail(overrides: Partial<ClassDetail> = {}): ClassDetail {
  const { isNew: _isNew, nextSessionAt: _next, ...base } = makeClassSummary();
  return {
    ...base,
    description:
      '흙을 처음 만지는 분도 두 시간이면 나만의 머그컵을 완성할 수 있어요. 손으로 빚는 핀칭 기법으로 형태를 잡고, 원하는 색 유약을 골라 마무리합니다.\n완성품은 가마 소성 후 3주 안에 택배로 보내 드려요.',
    difficulty: 'INTRO',
    location: '서울 성동구 성수이로 123 2층',
    locationNote: '성수역 3번 출구 5분',
    images: SAMPLE_IMAGES,
    learnings: ['흙 다루기와 꼬막밀기 기초', '핀칭으로 머그컵 형태 만들기', '손잡이 붙이기와 유약 고르기'],
    curriculum: [
      { offsetMinutes: 0, title: '공방 소개와 흙 다루기' },
      { offsetMinutes: 20, title: '형태 만들기' },
      { offsetMinutes: 80, title: '손잡이와 마감' },
      { offsetMinutes: 105, title: '유약 고르기' },
    ],
    inclusions: '재료비, 유약, 소성비, 앞치마 대여 · 택배비 별도',
    host: { name: '흙과손 공방' },
    sessions: [
      makeSession(),
      makeSession({
        id: 's2',
        startsAt: '2026-11-01T02:00:00.000Z',
        endsAt: '2026-11-01T04:00:00.000Z',
        remaining: 4,
      }),
      makeSession({
        id: 's3',
        startsAt: '2026-11-07T05:00:00.000Z',
        endsAt: '2026-11-07T07:00:00.000Z',
        remaining: 0,
        status: 'SOLD_OUT',
      }),
    ],
    ...overrides,
  };
}
