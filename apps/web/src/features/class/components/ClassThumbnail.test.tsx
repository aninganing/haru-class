import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { ClassThumbnail } from './ClassThumbnail';
import { SAMPLE_IMAGES } from '@/features/class/fixtures/classes';

const [A, B] = SAMPLE_IMAGES as [string, string];
const placeholder = (container: HTMLElement) => container.querySelector('[data-thumbnail="placeholder"]');

describe('ClassThumbnail', () => {
  it('이미지를 불러오지 못하면(onError) 기본 이미지 영역으로 바뀐다', () => {
    const { container } = render(<ClassThumbnail src={A} sizes="100vw" />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(placeholder(container)).toBeNull();

    fireEvent.error(img!);

    expect(container.querySelector('img')).toBeNull();
    expect(placeholder(container)).toBeInTheDocument();
  });

  it('실패한 뒤 다른 src가 들어오면 다시 이미지를 시도한다', () => {
    const { container, rerender } = render(<ClassThumbnail src={A} sizes="100vw" />);
    fireEvent.error(container.querySelector('img')!);
    expect(placeholder(container)).toBeInTheDocument();

    rerender(<ClassThumbnail src={B} sizes="100vw" />);

    expect(placeholder(container)).toBeNull();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('src가 없으면 처음부터 기본 이미지 영역이다', () => {
    const { container } = render(<ClassThumbnail src={null} sizes="100vw" />);

    expect(container.querySelector('img')).toBeNull();
    expect(placeholder(container)).toBeInTheDocument();
  });

  it('기본 이미지 영역은 스크린 리더에 숨기고 접근성 위반이 없다', async () => {
    const { container } = render(<ClassThumbnail src={A} sizes="100vw" />);
    fireEvent.error(container.querySelector('img')!);

    expect(placeholder(container)).toHaveAttribute('aria-hidden', 'true');
    await expectNoA11yViolations(container);
  });
});
