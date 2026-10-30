import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Toaster } from '@aninganing/react';
import { COPIED_MESSAGE, COPY_FAILED_MESSAGE } from '@/features/class/constants/messages';
import { ShareButton } from './ShareButton';

/** navigator.share / clipboard를 스토리 동안만 바꾼다 */
const stubNavigator = (writeText: ((text: string) => Promise<void>) | undefined) => () => {
  const share = Object.getOwnPropertyDescriptor(navigator, 'share');
  const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText ? { writeText } : undefined,
    configurable: true,
  });
  return () => {
    if (share) Object.defineProperty(navigator, 'share', share);
    else delete (navigator as { share?: unknown }).share;
    if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard);
    else delete (navigator as { clipboard?: unknown }).clipboard;
  };
};

const meta = {
  title: 'Class/ShareButton',
  component: ShareButton,
  args: { title: '성수 도자기 원데이클래스' },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: '14rem', padding: 'var(--space-4)' }}>
        <Story />
        {/* 앱에서는 Providers가 마운트한다 */}
        <Toaster />
      </div>
    ),
  ],
} satisfies Meta<typeof ShareButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

/** PC: 링크 복사 → 토스트 "링크를 복사했어요" */
export const Copied: Story = {
  beforeEach: stubNavigator(() => Promise.resolve()),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '공유하기' }));
    const body = within(canvasElement.ownerDocument.body);
    await expect((await body.findAllByText(COPIED_MESSAGE)).length).toBeGreaterThan(0);
  },
};

/** 복사 실패 → "링크 복사하기" 창(주소 전체 선택) */
export const CopyFailed: Story = {
  beforeEach: stubNavigator(() => Promise.reject(new Error('denied'))),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '공유하기' }));
    // Dialog는 portal로 body에 그려진다
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole('dialog', { name: '링크 복사하기' });
    await expect(dialog).toHaveTextContent(COPY_FAILED_MESSAGE);
    await expect(body.getByLabelText('클래스 주소')).toBeInTheDocument();
  },
};
