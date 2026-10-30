import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeClassDetail } from '@/features/class/fixtures/classes';
import { UpcomingSessions } from './UpcomingSessions';

const meta = {
  title: 'Class/UpcomingSessions',
  component: UpcomingSessions,
  args: { classId: 'c1', sessions: makeClassDetail().sessions },
} satisfies Meta<typeof UpcomingSessions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 잔여 1석(danger) · 4석(neutral) · 마감 */
export const Default: Story = {};

export const Empty: Story = { args: { sessions: [] } };
