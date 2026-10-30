import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { json, mockFetch } from '@/test/mock-fetch';
import { HealthStatus } from './HealthStatus';

const meta = {
  title: 'System/HealthStatus',
  component: HealthStatus,
} satisfies Meta<typeof HealthStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ok: Story = {
  beforeEach: () => mockFetch(() => json({ status: 'ok', checks: { database: 'up', redis: 'up' } })),
};

export const Degraded: Story = {
  beforeEach: () =>
    mockFetch(() => json({ status: 'degraded', checks: { database: 'up', redis: 'down' } })),
};

export const ApiDown: Story = {
  beforeEach: () => mockFetch(() => json({ statusCode: 502, message: 'Bad Gateway' }, 502)),
};
