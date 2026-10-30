import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockScroll } from '@/test/browser-apis';
import { useHorizontalScroller } from './useHorizontalScroller';

function Row({ ratio }: { ratio?: number }) {
  const { ref, scrollPrev, scrollNext } = useHorizontalScroller<HTMLUListElement>(ratio);
  return (
    <>
      <ul ref={ref} aria-label="줄" />
      <button onClick={scrollPrev}>이전</button>
      <button onClick={scrollNext}>다음</button>
    </>
  );
}

describe('useHorizontalScroller', () => {
  let scroll: ReturnType<typeof mockScroll>;
  beforeEach(() => {
    scroll = mockScroll();
  });
  afterEach(() => scroll.restore());

  it('다음/이전은 요소 폭 × 0.9만큼 오른쪽/왼쪽으로 스크롤한다', () => {
    render(<Row />);
    Object.defineProperty(screen.getByRole('list', { name: '줄' }), 'clientWidth', { value: 400 });

    screen.getByRole('button', { name: '다음' }).click();
    screen.getByRole('button', { name: '이전' }).click();

    expect(scroll.scrollBy.mock.calls).toEqual([[{ left: 360 }], [{ left: -360 }]]);
  });

  it('비율을 바꿀 수 있다', () => {
    render(<Row ratio={0.5} />);
    Object.defineProperty(screen.getByRole('list', { name: '줄' }), 'clientWidth', { value: 400 });

    screen.getByRole('button', { name: '다음' }).click();

    expect(scroll.scrollBy).toHaveBeenCalledWith({ left: 200 });
  });
});
