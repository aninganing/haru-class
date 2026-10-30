import type { ClassListResponse } from '@haru/contracts';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { json, mockFetch } from '@/test/mock-fetch';
import { desktopViewport, mobileViewport } from '@/test/story-viewports';
import { ClassList } from './ClassList';
import { makeClassPage, makeClassSummary } from '@/features/class/fixtures/classes';

type Reply = ClassListResponse | (() => Response | Promise<Response>);

/** cursor별 응답. 배열이면 호출 순서대로 하나씩 쓴다 (마지막 것은 반복). */
const serve = (routes: Record<string, Reply | Reply[]>) => {
  const counts: Record<string, number> = {};
  return mockFetch((url) => {
    const cursor = new URL(url, 'http://localhost').searchParams.get('cursor') ?? 'first';
    const route = routes[cursor];
    if (route === undefined) return json({ statusCode: 404, message: 'Not Found' }, 404);
    const n = counts[cursor] ?? 0;
    counts[cursor] = n + 1;
    const reply = Array.isArray(route) ? route[Math.min(n, route.length - 1)]! : route;
    return typeof reply === 'function' ? reply() : json(reply);
  });
};

const never = () => new Promise<Response>(() => {});
const serverError = () => json({ statusCode: 500, message: 'Internal server error' }, 500);
const badCursor = () => json({ statusCode: 400, message: 'Validation failed', error: 'Bad Request' }, 400);

const meta = {
  title: 'Class/ClassList',
  component: ClassList,
} satisfies Meta<typeof ClassList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 첫 페이지 → 목록 끝이 보이면 자동으로 다음 페이지 → 끝 안내 */
export const Default: Story = {
  beforeEach: () =>
    serve({
      first: makeClassPage(1, 6, 'cursor-2'),
      'cursor-2': makeClassPage(7, 6, null),
    }),
};

export const InitialLoading: Story = {
  beforeEach: () => serve({ first: never }),
};

export const InitialError: Story = {
  beforeEach: () => serve({ first: serverError }),
};

export const Empty: Story = {
  beforeEach: () => serve({ first: { items: [], nextCursor: null } }),
};

/** 첫 페이지가 마지막 페이지 */
export const EndOfList: Story = {
  beforeEach: () => serve({ first: makeClassPage(1, 3, null) }),
};

/** 다음 페이지 응답이 오지 않음 → 목록 끝에 Skeleton */
export const LoadingMore: Story = {
  beforeEach: () => serve({ first: makeClassPage(1, 3, 'cursor-2'), 'cursor-2': never }),
};

/** 다음 페이지 5xx → 자동 로드 중지 + 다시 시도 */
export const LoadMoreError: Story = {
  beforeEach: () => serve({ first: makeClassPage(1, 3, 'cursor-2'), 'cursor-2': serverError }),
};

/** 다음 페이지 400(잘못된 cursor) → 다시 시도하면 첫 페이지부터 */
export const StaleCursor: Story = {
  beforeEach: () =>
    serve({
      first: [makeClassPage(1, 3, 'cursor-2'), makeClassPage(21, 3, null)],
      'cursor-2': badCursor,
    }),
};

/** 키보드로 "다시 시도" → 같은 cursor로 다시 불러와 성공 */
export const RetryWithKeyboard: Story = {
  beforeEach: () =>
    serve({
      first: makeClassPage(1, 3, 'cursor-2'),
      'cursor-2': [serverError, () => json(makeClassPage(4, 3, null))],
    }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const retry = await canvas.findByRole('button', { name: '다시 시도' });
    retry.focus();
    await userEvent.keyboard('{Enter}');
    await expect(await canvas.findByRole('heading', { name: '클래스 4' })).toBeInTheDocument();
    await expect(canvas.getByText('모든 클래스를 다 봤어요')).toHaveFocus();
  },
};

/** 카테고리 필터 (요청 URL에 category가 붙는다) */
export const Category: Story = {
  args: { category: 'FLOWER' },
  beforeEach: () => serve({ first: makeClassPage(1, 4, null) }),
};

/** 좁은 화면 + 긴 제목·썸네일 없음·정원 모름 */
export const MobileLongText: Story = {
  ...mobileViewport,
  beforeEach: () =>
    serve({
      first: {
        items: [
          makeClassSummary({
            id: 'long',
            title: '도자기 물레 체험과 나만의 머그컵 만들기 — 초보자도 두 시간이면 완성하는 원데이 클래스',
            neighborhood: '경기도 성남시 분당구 정자동',
            thumbnailUrl: null,
            durationMinutes: 150,
          }),
          makeClassSummary({ id: 'free', title: '무료 체험 클래스', price: 0, maxCapacity: null, isNew: false }),
        ],
        nextCursor: null,
      },
    }),
};

/** PC: 세로 카드 그리드 */
export const Desktop: Story = {
  ...desktopViewport,
  beforeEach: () => serve({ first: makeClassPage(1, 8, 'cursor-2'), 'cursor-2': never }),
};
