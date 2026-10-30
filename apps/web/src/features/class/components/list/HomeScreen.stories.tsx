import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { AppHeader } from '@/components/layout/AppHeader';
import { containerClass, mainWithTabBarClass } from '@/components/layout/layout-classes';
import { BottomTabBar } from '@/components/layout/MainNav';
import { ClosingSoonSection } from '@/features/session/components/ClosingSoonSection';
import { makeClosingSoon } from '@/features/session/fixtures/sessions';
import { cn } from '@/lib/cn';
import { json, mockFetch } from '@/test/mock-fetch';
import { desktopViewport, mobileViewport } from '@/test/story-viewports';
import { CategoryChips } from './CategoryChips';
import { ClassList } from './ClassList';
import { makeClassPage } from '@/features/class/fixtures/classes';

/** app/(main)/layout + page와 같은 조합 (서버 컴포넌트 대신 클라이언트 조각을 직접 그린다) */
function HomeScreen() {
  return (
    <>
      <AppHeader theme="light" />
      <main className={cn(containerClass, mainWithTabBarClass)}>
        <h1 className="sr-only">클래스 둘러보기</h1>
        <CategoryChips />
        <ClosingSoonSection />
        <ClassList />
      </main>
      <BottomTabBar />
    </>
  );
}

const serveHome = () =>
  mockFetch((url) => {
    if (url.startsWith('/api/sessions/closing-soon')) return json(makeClosingSoon(5));
    const cursor = new URL(url, 'http://localhost').searchParams.get('cursor');
    return cursor ? new Promise<Response>(() => {}) : json(makeClassPage(1, 8, 'cursor-2'));
  });

const meta = {
  title: 'Pages/Home',
  component: HomeScreen,
  parameters: { layout: 'fullscreen', nextjs: { navigation: { pathname: '/' } } },
  beforeEach: serveHome,
} satisfies Meta<typeof HomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  ...mobileViewport,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(390);
    const tabBar = within(canvasElement).getByRole('navigation', { name: '하단 메뉴' });
    await expect(getComputedStyle(tabBar).display).not.toBe('none');
  },
};

export const Desktop: Story = {
  ...desktopViewport,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(1280);
    const canvas = within(canvasElement);
    // PC에서는 하단 탭을 숨기고 헤더 내비를 쓴다
    // display: none인 요소는 접근성 트리에 없어 role로 찾지 않는다
    const tabBar = canvasElement.querySelector('nav[aria-label="하단 메뉴"]')!;
    await expect(getComputedStyle(tabBar).display).toBe('none');
    await expect(getComputedStyle(canvas.getByRole('navigation', { name: '주 메뉴' })).display).not.toBe('none');
  },
};
