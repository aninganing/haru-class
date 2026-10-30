import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { json, mockFetch } from '@/test/mock-fetch';
import { desktopViewport, mobileViewport } from '@/test/story-viewports';
import { ClosingSoonSection } from './ClosingSoonSection';
import { makeClosingSoon } from '@/features/session/fixtures/sessions';

const meta = {
  title: 'Session/ClosingSoonSection',
  component: ClosingSoonSection,
} satisfies Meta<typeof ClosingSoonSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  beforeEach: () => mockFetch(() => json(makeClosingSoon(6))),
};

export const Loading: Story = {
  beforeEach: () => mockFetch(() => new Promise<Response>(() => {})),
};

/** 0개면 섹션을 그리지 않는다 (빈 화면이 정상) */
export const Empty: Story = {
  beforeEach: () => mockFetch(() => json({ items: [] })),
};

export const ApiError: Story = {
  beforeEach: () => mockFetch(() => json({ statusCode: 500, message: 'Internal server error' }, 500)),
};

export const Mobile: Story = {
  ...mobileViewport,
  beforeEach: () => mockFetch(() => json(makeClosingSoon(3))),
};

/** PC: 가로 스크롤 유지 + ‹ › 버튼 */
export const Desktop: Story = {
  ...desktopViewport,
  beforeEach: () => mockFetch(() => json(makeClosingSoon(10))),
};
