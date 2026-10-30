import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { mobileViewport } from '@/test/story-viewports';
import { ClassGallery } from './ClassGallery';
import { SAMPLE_IMAGES } from '@/features/class/fixtures/classes';

const meta = {
  title: 'Class/ClassGallery',
  component: ClassGallery,
  args: { images: SAMPLE_IMAGES },
} satisfies Meta<typeof ClassGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Multiple: Story = {};

export const MobileSwipe: Story = { ...mobileViewport };

export const Single: Story = { args: { images: SAMPLE_IMAGES.slice(0, 1) } };

export const Empty: Story = { args: { images: [] } };

/** 빠른 연타: smooth 스크롤 중에 지나가는 슬라이드로 카운터가 되돌아가지 않아야 한다 */
export const FastDoubleNext: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: '다음 사진' });
    next.focus();
    await userEvent.keyboard('{Enter}{Enter}');
    // 스크롤이 진행되는 1초 동안 50ms마다 상태를 본다. 한 번이라도 중간 장으로 되돌아가면 실패
    const counter = () => canvasElement.querySelector('[aria-hidden="true"]:not(svg)')?.textContent?.replace(/\s/g, '');
    const samples: string[] = [];
    for (let i = 0; i < 20; i++) {
      samples.push(`${counter()}|${next.getAttribute('aria-disabled')}`);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    await expect(samples.filter((s) => s !== '3/3|true')).toEqual([]);
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(canvas.getByText('3 / 3')).toBeInTheDocument();
    await expect(canvas.getByRole('status')).toHaveTextContent('사진 3 / 3');
  },
};

/** 키보드: 다음 사진 버튼 → status 안내, 끝에서는 aria-disabled */
export const KeyboardNavigate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: '다음 사진' });
    next.focus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status')).toHaveTextContent('사진 2 / 3');
    await userEvent.keyboard('{Enter}');
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toHaveFocus();
  },
};
