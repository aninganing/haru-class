import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { desktopViewport, mobileViewport, tabletViewport } from '@/test/story-viewports';
import { ClassDetailView } from './ClassDetailView';
import { makeClassDetail, makeSession } from '@/features/class/fixtures/classes';

const meta = {
  title: 'Class/ClassDetailView',
  component: ClassDetailView,
  args: { detail: makeClassDetail() },
  parameters: { layout: 'fullscreen', nextjs: { navigation: { pathname: '/classes/c1' } } },
  decorators: [
    // 앱의 classes/layout과 같은 좌우 여백
    (Story) => (
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 var(--space-5)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ClassDetailView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 시안 그대로: 갤러리 위 뒤로·공유, 하단 고정 CTA */
export const Mobile: Story = {
  ...mobileViewport,
  play: async ({ canvasElement }) => {
    // viewport 프리셋이 Storybook 테스트(Chromium)에서도 적용되는지 확인
    await expect(window.innerWidth).toBe(390);
    const cta = within(canvasElement).getByRole('link', { name: '회차 선택하기' });
    await expect(getComputedStyle(cta.parentElement!).position).toBe('fixed');
  },
};

/** 48~64rem: 1단 + 하단 고정 CTA, 정보 4칸 한 줄 */
export const Tablet: Story = {
  ...tabletViewport,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(820);
    const cta = within(canvasElement).getByRole('link', { name: '회차 선택하기' });
    await expect(getComputedStyle(cta.parentElement!).position).toBe('fixed');
  },
};

/** 64rem 이상: 왼쪽 콘텐츠 / 오른쪽 sticky 예약 카드 */
export const Desktop: Story = {
  ...desktopViewport,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(1280);
    const booking = within(canvasElement).getByRole('complementary', { name: '예약' });
    await expect(getComputedStyle(booking).position).toBe('sticky');
  },
};

export const AllSoldOut: Story = {
  ...mobileViewport,
  args: {
    detail: makeClassDetail({
      maxCapacity: null,
      sessions: [makeSession({ remaining: 0, status: 'SOLD_OUT' }), makeSession({ id: 's2', remaining: 0, status: 'SOLD_OUT' })],
    }),
  },
};

export const NoSessions: Story = {
  ...desktopViewport,
  args: { detail: makeClassDetail({ sessions: [], maxCapacity: null }) },
};

export const NoImages: Story = {
  ...mobileViewport,
  args: { detail: makeClassDetail({ images: [], thumbnailUrl: null }) },
};

/** 서울 자정을 넘는 회차 */
export const PastMidnightSession: Story = {
  ...mobileViewport,
  args: {
    detail: makeClassDetail({
      title: '심야 와인 페어링',
      sessions: [makeSession({ startsAt: '2026-11-03T13:30:00.000Z', endsAt: '2026-11-03T15:30:00.000Z', remaining: 5 })],
    }),
  },
};

export const LongText: Story = {
  ...mobileViewport,
  args: {
    detail: makeClassDetail({
      title: '도자기 물레 체험과 나만의 머그컵 만들기 — 초보자도 두 시간이면 완성하는 원데이 클래스',
      tags: ['입문자 추천', '주말 인기', '혼자 오기 좋아요'],
      locationNote: '성수역 3번 출구에서 도보 5분, 건물 뒤편 계단으로 2층',
      price: 0,
      description: Array.from(
        { length: 6 },
        (_, i) => `${i + 1}단계: 흙을 반죽하고 물레 위에서 중심을 잡는 법부터 차근차근 배워요.`,
      ).join('\n'),
    }),
  },
};
