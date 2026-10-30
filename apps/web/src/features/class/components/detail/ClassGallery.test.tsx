import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { mockScroll } from '@/test/browser-apis';
import { expectNoReactKeyWarnings } from '@/test/react-warnings';
import { ClassGallery } from './ClassGallery';
import { SAMPLE_IMAGES } from '@/features/class/fixtures/classes';

describe('ClassGallery', () => {
  let scroll: ReturnType<typeof mockScroll>;
  beforeEach(() => {
    scroll = mockScroll();
  });
  afterEach(() => scroll.restore());

  it('사진 수만큼 슬라이드를 "n / N" 라벨로 보여주고 카운터는 1 / N에서 시작한다', () => {
    render(<ClassGallery images={SAMPLE_IMAGES} />);

    expect(screen.getByRole('region', { name: '클래스 사진' })).toHaveAttribute('aria-roledescription', 'carousel');
    const slides = screen.getAllByRole('group');
    expect(slides.map((s) => s.getAttribute('aria-label'))).toEqual(['1 / 3', '2 / 3', '3 / 3']);
    expect(screen.getByText('1 / 3')).toHaveAttribute('aria-hidden', 'true');
  });

  it('다음·이전 버튼으로 넘기면 카운터가 바뀌고 status로 알린다', async () => {
    render(<ClassGallery images={SAMPLE_IMAGES} />);

    await userEvent.click(screen.getByRole('button', { name: '다음 사진' }));

    expect(screen.getByRole('status')).toHaveTextContent('사진 2 / 3');
    expect(screen.getByText('2 / 3', { selector: 'span' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '이전 사진' }));
    expect(screen.getByRole('status')).toHaveTextContent('사진 1 / 3');
  });

  it('처음과 끝에서는 버튼을 aria-disabled로 두고 포커스를 유지한다 (키보드)', async () => {
    render(<ClassGallery images={SAMPLE_IMAGES} />);
    expect(screen.getByRole('button', { name: '이전 사진' })).toHaveAttribute('aria-disabled', 'true');

    const next = screen.getByRole('button', { name: '다음 사진' });
    next.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Enter}'); // 끝에서 한 번 더 눌러도 그대로

    expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(next).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('사진 3 / 3');
  });

  it('스크롤 영역은 키보드로 포커스할 수 있다 (방향키로 넘기기)', async () => {
    render(<ClassGallery images={SAMPLE_IMAGES} />);

    await userEvent.tab();

    expect(screen.getByRole('region', { name: '사진 목록, 방향키로 넘기기' })).toHaveFocus();
  });

  it('사진이 한 장이면 버튼과 카운터가 없다', () => {
    render(<ClassGallery images={SAMPLE_IMAGES.slice(0, 1)} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
  });

  it('사진이 없으면 기본 이미지 영역만 보여준다', () => {
    const { container } = render(<ClassGallery images={[]} />);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-thumbnail="placeholder"]')).toBeInTheDocument();
  });

  it('같은 URL의 사진이 두 번 있어도 key 경고 없이 슬라이드 3장을 그린다', async () => {
    const [a, b] = SAMPLE_IMAGES as [string, string];

    await expectNoReactKeyWarnings(() => render(<ClassGallery images={[a, a, b]} />));

    expect(screen.getAllByRole('group').map((g) => g.getAttribute('aria-label'))).toEqual(['1 / 3', '2 / 3', '3 / 3']);
  });

  it('슬라이드 이미지를 불러오지 못하면 그 슬라이드만 기본 이미지 영역으로 바꾼다', () => {
    render(<ClassGallery images={SAMPLE_IMAGES} />);
    const [first, second] = screen.getAllByRole('group') as [HTMLElement, HTMLElement];

    fireEvent.error(second.querySelector('img')!);

    expect(second.querySelector('img')).toBeNull();
    expect(second.querySelector('[data-thumbnail="placeholder"]')).toBeInTheDocument();
    expect(first.querySelector('img')).toBeInTheDocument();
    expect(screen.getAllByRole('group')).toHaveLength(3);
  });

  it('접근성 위반이 없다', async () => {
    const { container } = render(<ClassGallery images={SAMPLE_IMAGES} />);
    await expectNoA11yViolations(container);
  });
});
