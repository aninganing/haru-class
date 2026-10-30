import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { desktopViewport, mobileViewport } from '@/test/story-viewports';
import { AppHeader } from './AppHeader';
import { BottomTabBar } from './MainNav';

const meta = {
  title: 'Layout/Navigation',
  component: BottomTabBar,
  parameters: { layout: 'fullscreen', themes: { disable: false } },
} satisfies Meta<typeof BottomTabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 모바일: 하단 탭 (홈·내 예약) */
export const MobileHome: Story = {
  ...mobileViewport,
  parameters: { nextjs: { navigation: { pathname: '/' } } },
  render: () => (
    <>
      <AppHeader theme="light" />
      <BottomTabBar />
    </>
  ),
};

export const MobileBookings: Story = {
  ...mobileViewport,
  parameters: { nextjs: { navigation: { pathname: '/bookings' } } },
};

/** PC: 하단 탭 대신 헤더 내비 */
export const DesktopHeader: Story = {
  ...desktopViewport,
  parameters: { nextjs: { navigation: { pathname: '/' } } },
  render: () => (
    <>
      <AppHeader theme="light" />
      <BottomTabBar />
    </>
  ),
};
