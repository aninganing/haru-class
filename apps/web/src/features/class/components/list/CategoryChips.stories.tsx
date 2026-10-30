import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mobileViewport } from '@/test/story-viewports';
import { CategoryChips } from './CategoryChips';

const meta = {
  title: 'Class/CategoryChips',
  component: CategoryChips,
} satisfies Meta<typeof CategoryChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {};

export const Selected: Story = {
  args: { category: 'FLOWER' },
};

/** 좁은 화면에서는 가로로 스크롤된다 */
export const Mobile: Story = {
  ...mobileViewport,
  args: { category: 'SCENT' },
};
