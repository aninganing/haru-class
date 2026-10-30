import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockScroll } from '@/test/browser-apis';
import { mockIntersectionObserver } from '@/test/intersection-observer';
import { PROGRAMMATIC_SCROLL_TIMEOUT_MS, useGalleryNavigation } from './useGalleryNavigation';

/** 훅을 실제 요소에 붙여 본다. 현재 장·처음/끝·안내를 글자로 내보낸다 */
function Gallery({ total }: { total: number }) {
  const { scrollRef, slideRef, current, announcement, isFirst, isLast, goPrev, goNext } = useGalleryNavigation(total);
  return (
    <>
      <div ref={scrollRef} data-testid="scroll">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} ref={slideRef(i)} data-testid={`slide-${i}`} />
        ))}
      </div>
      <output data-testid="state">{`${current}|${isFirst}|${isLast}|${announcement}`}</output>
      <button onClick={goPrev}>prev</button>
      <button onClick={goNext}>next</button>
    </>
  );
}

const state = () => screen.getByTestId('state').textContent;
const slide = (i: number) => screen.getByTestId(`slide-${i}`);
const click = (name: string) => act(() => screen.getByRole('button', { name }).click());

describe('useGalleryNavigation', () => {
  let scroll: ReturnType<typeof mockScroll>;
  beforeEach(() => {
    scroll = mockScroll();
  });
  afterEach(() => {
    scroll.restore();
    vi.useRealTimers();
  });

  it('처음 장에서 시작하고, 버튼 이동은 그 장으로 스크롤하며 "사진 i / N"을 알린다', () => {
    mockIntersectionObserver();
    render(<Gallery total={3} />);
    Object.defineProperty(screen.getByTestId('scroll'), 'clientWidth', { value: 300 });
    expect(state()).toBe('0|true|false|');

    click('next');

    expect(state()).toBe('1|false|false|사진 2 / 3');
    expect(scroll.scrollTo).toHaveBeenCalledWith({ left: 300 });
  });

  it('처음·끝 밖으로는 움직이지 않는다', () => {
    mockIntersectionObserver();
    render(<Gallery total={2} />);

    click('prev');
    expect(state()).toBe('0|true|false|');
    click('next');
    click('next');
    expect(state()).toBe('1|false|true|사진 2 / 2');
    expect(scroll.scrollTo).toHaveBeenCalledTimes(1);
  });

  it('스와이프(observer)는 현재 장을 따라가되 안내하지 않는다', () => {
    const io = mockIntersectionObserver();
    render(<Gallery total={3} />);

    io.enter(slide(2));

    expect(state()).toBe('2|false|true|');
  });

  it('버튼 이동 중에는 지나가는 슬라이드를 무시하고, 목표에 도착하면 다시 따라간다', () => {
    const io = mockIntersectionObserver();
    render(<Gallery total={3} />);

    click('next');
    click('next');
    io.enter(slide(1)); // smooth 스크롤 중 지나감
    expect(state()).toMatch(/^2\|/);

    io.enter(slide(2)); // 도착 → 잠금 해제
    io.enter(slide(0)); // 이후 스와이프는 따라간다
    expect(state()).toMatch(/^0\|/);
  });

  it('scrollend나 사용자의 직접 스크롤이 오면 잠금을 푼다', () => {
    const io = mockIntersectionObserver();
    render(<Gallery total={3} />);

    click('next');
    fireEvent(screen.getByTestId('scroll'), new Event('scrollend'));
    io.enter(slide(2));
    expect(state()).toMatch(/^2\|/);

    click('prev');
    fireEvent.pointerDown(screen.getByTestId('scroll'));
    io.enter(slide(0));
    expect(state()).toMatch(/^0\|/);
  });

  it.each([['wheel'], ['touchstart']])('%s 이벤트(사용자의 직접 스크롤)가 와도 잠금을 푼다', (eventName) => {
    const io = mockIntersectionObserver();
    render(<Gallery total={3} />);

    click('next');
    fireEvent(screen.getByTestId('scroll'), new Event(eventName));
    io.enter(slide(2));

    expect(state()).toMatch(/^2\|/);
  });

  it('목표에 끝내 닿지 못해도 1.5초 뒤에는 잠금을 푼다', () => {
    vi.useFakeTimers();
    const io = mockIntersectionObserver();
    render(<Gallery total={3} />);

    click('next');
    io.enter(slide(2));
    expect(state()).toMatch(/^1\|/);

    act(() => vi.advanceTimersByTime(PROGRAMMATIC_SCROLL_TIMEOUT_MS));
    io.enter(slide(2));
    expect(state()).toMatch(/^2\|/);
  });

  it('사진이 한 장이면 observer를 만들지 않는다', () => {
    const io = mockIntersectionObserver();
    render(<Gallery total={1} />);

    expect(io.active).toHaveLength(0);
    expect(state()).toBe('0|true|true|');
  });
});
