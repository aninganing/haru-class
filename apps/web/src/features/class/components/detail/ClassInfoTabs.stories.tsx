import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ClassInfoTabs } from './ClassInfoTabs';
import { makeClassDetail } from '@/features/class/fixtures/classes';

const meta = {
  title: 'Class/ClassInfoTabs',
  component: ClassInfoTabs,
  args: { detail: makeClassDetail() },
} satisfies Meta<typeof ClassInfoTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Intro: Story = {};

export const EmptyCurriculum: Story = {
  args: { detail: makeClassDetail({ curriculum: [], learnings: [] }) },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('tab', { name: '커리큘럼' }));
  },
};

/** 방향키로 탭 이동 (automatic activation) */
export const ArrowKeys: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('tab', { name: '소개' }).focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: '위치' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('성수역 3번 출구 5분');
  },
};
