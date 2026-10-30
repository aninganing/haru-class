import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ThemeToggle } from './ThemeToggle';

const meta = {
  title: 'Layout/ThemeToggle',
  component: ThemeToggle,
  args: { initialTheme: 'light' },
  // 이 컴포넌트가 직접 data-theme을 바꾸므로 테마 애드온이 덮어쓰지 않게 끈다.
  parameters: { themes: { disable: true } },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};

export const Dark: Story = {
  args: { initialTheme: 'dark' },
  // 스위치는 <html data-theme>을 읽으므로 실제 페이지처럼 html도 dark여야 한다.
  // 직접 바꾸면 테마 애드온이 렌더 뒤에 기본값으로 되돌리므로, 이 스토리만 애드온으로 dark를 지정한다.
  parameters: { themes: { disable: false } },
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('switch', { name: '다크 모드' })).toBeChecked();
  },
};

export const Toggle: Story = {
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole('switch', { name: '다크 모드' });
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    await expect(document.documentElement.dataset.theme).toBe('dark');
  },
};
