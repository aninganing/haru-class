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
};

export const Toggle: Story = {
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole('switch', { name: '다크 모드' });
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    await expect(document.documentElement.dataset.theme).toBe('dark');
  },
};
