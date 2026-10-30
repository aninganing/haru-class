import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { desktopViewport, mobileViewport } from '@/test/story-viewports';
import { ClassListItem } from './ClassListItem';
import { makeClassSummary } from '@/features/class/fixtures/classes';
import { classListClass } from '@/features/class/styles/home-classes';

const meta = {
  title: 'Class/ClassListItem',
  component: ClassListItem,
  args: { item: makeClassSummary() },
  decorators: [
    (Story) => (
      <ul className={classListClass}>
        <li>
          <Story />
        </li>
      </ul>
    ),
  ],
} satisfies Meta<typeof ClassListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = { ...mobileViewport };

export const NotNew: Story = {
  ...mobileViewport,
  args: { item: makeClassSummary({ isNew: false }) },
};

export const NoThumbnail: Story = {
  ...mobileViewport,
  args: { item: makeClassSummary({ thumbnailUrl: null }) },
};

/** 예약 가능한 회차가 없어 정원을 모름 → 메타에서 "최대 N명" 생략 */
export const NoCapacity: Story = {
  ...mobileViewport,
  args: { item: makeClassSummary({ maxCapacity: null, price: 0 }) },
};

export const LongText: Story = {
  ...mobileViewport,
  args: {
    item: makeClassSummary({
      title: '도자기 물레 체험과 나만의 머그컵 만들기 — 초보자도 두 시간이면 완성하는 원데이 클래스',
      neighborhood: '경기도 성남시 분당구 정자동',
      durationMinutes: 150,
    }),
  },
};

/** 48rem 이상에서는 세로 카드 */
export const Desktop: Story = { ...desktopViewport };
