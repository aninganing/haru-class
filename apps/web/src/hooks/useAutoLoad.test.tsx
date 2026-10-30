import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockIntersectionObserver } from '@/test/intersection-observer';
import { useAutoLoad } from './useAutoLoad';

function Sentinel(props: { enabled: boolean; onLoad: () => void; resetKey?: unknown }) {
  const ref = useAutoLoad<HTMLDivElement>({ ...props, rootMargin: '0px 0px 200px 0px' });
  return <div ref={ref} />;
}

describe('useAutoLoad', () => {
  it('감시 요소가 화면에 들어오면 onLoad를 부르고 rootMargin을 넘긴다', () => {
    const io = mockIntersectionObserver();
    const onLoad = vi.fn();
    render(<Sentinel enabled onLoad={onLoad} />);

    expect(io.active).toHaveLength(1);
    expect(io.active[0]?.rootMargin).toBe('0px 0px 200px 0px');
    io.leave();
    expect(onLoad).not.toHaveBeenCalled();
    io.enter();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('enabled가 false면 감시하지 않고, 꺼지면 observer를 끊는다', () => {
    const io = mockIntersectionObserver();
    const onLoad = vi.fn();
    const { rerender } = render(<Sentinel enabled={false} onLoad={onLoad} />);
    expect(io.active).toHaveLength(0);

    rerender(<Sentinel enabled onLoad={onLoad} />);
    expect(io.active).toHaveLength(1);
    rerender(<Sentinel enabled={false} onLoad={onLoad} />);
    expect(io.active).toHaveLength(0);
    io.enter();
    expect(onLoad).not.toHaveBeenCalled();
  });

  it('onLoad가 매 렌더 새 함수여도 observer를 다시 만들지 않고 최신 함수를 부른다', () => {
    const io = mockIntersectionObserver();
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = render(<Sentinel enabled onLoad={first} />);
    const observer = io.active[0];

    rerender(<Sentinel enabled onLoad={latest} />);
    expect(io.active).toEqual([observer]);
    io.enter();
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
  });

  it('resetKey가 바뀌면 observer를 새로 만든다 (불러온 뒤에도 보이면 이어서 부르도록)', () => {
    const io = mockIntersectionObserver();
    const onLoad = vi.fn();
    const { rerender } = render(<Sentinel enabled onLoad={onLoad} resetKey={1} />);
    const before = io.active[0];

    rerender(<Sentinel enabled onLoad={onLoad} resetKey={2} />);
    expect(io.active).toHaveLength(1);
    expect(io.active[0]).not.toBe(before);
  });

  it('IntersectionObserver가 없는 환경에서는 아무것도 하지 않는다', () => {
    const onLoad = vi.fn();
    expect(() => render(<Sentinel enabled onLoad={onLoad} />)).not.toThrow();
    expect(onLoad).not.toHaveBeenCalled();
  });
});
