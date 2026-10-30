import type { ClassCategory } from '@haru/contracts';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetNavigation, router } from '@/test/next-navigation';
import { useCategoryNavigation } from './useCategoryNavigation';

vi.mock('next/navigation', async () => (await import('@/test/next-navigation')).navigationMock);

const setup = (category?: ClassCategory) =>
  renderHook(({ current }: { current?: ClassCategory }) => useCategoryNavigation(current), {
    initialProps: { current: category },
  });

describe('useCategoryNavigation', () => {
  beforeEach(() => resetNavigation('/'));

  it('다른 카테고리로 가면 ?category=로 push하고 스크롤은 유지한다', () => {
    const { result } = setup();

    act(() => result.current.go('CRAFT'));

    expect(router.push).toHaveBeenCalledWith('/?category=CRAFT', { scroll: false });
  });

  it('전체(undefined)로 가면 "/"로 push한다', () => {
    const { result } = setup('CRAFT');

    act(() => result.current.go(undefined));

    expect(router.push).toHaveBeenCalledWith('/', { scroll: false });
  });

  it.each([
    ['전체에서 전체', undefined],
    ['공예에서 공예', 'CRAFT' as const],
  ])('%s로는 이동하지 않는다', (_, category) => {
    const { result } = setup(category);

    act(() => result.current.go(category));

    expect(router.push).not.toHaveBeenCalled();
  });

  it('처음 화면에서는 알리지 않고, 카테고리가 바뀌면 결과를 알린다', () => {
    const { result, rerender } = setup();
    expect(result.current.announcement).toBe('');

    rerender({ current: 'FLOWER' });
    expect(result.current.announcement).toBe('플라워 클래스를 보여드려요');

    rerender({ current: undefined });
    expect(result.current.announcement).toBe('전체 클래스를 보여드려요');
  });

  it('카테고리가 그대로면 다시 그려져도 안내를 바꾸지 않는다', () => {
    const { result, rerender } = setup('SCENT');

    rerender({ current: 'SCENT' });

    expect(result.current.announcement).toBe('');
  });

  it('이동하지 않은 상태에서는 isPending이 false다', () => {
    const { result } = setup();
    expect(result.current.isPending).toBe(false);
  });
});
