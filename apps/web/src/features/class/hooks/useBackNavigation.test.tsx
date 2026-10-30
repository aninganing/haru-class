import { renderHook } from '@testing-library/react';
import type { MouseEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canGoBackToList } from '@/lib/navigation-history';
import { resetNavigation, router } from '@/test/next-navigation';
import { useBackNavigation } from './useBackNavigation';

vi.mock('next/navigation', async () => (await import('@/test/next-navigation')).navigationMock);
// "바로 앞이 목록인가" 판정은 navigation-history 테스트가 맡는다. 여기서는 그 결과에 따른 클릭 처리만 본다
vi.mock('@/lib/navigation-history', () => ({ canGoBackToList: vi.fn() }));

type ClickInit = Partial<Pick<MouseEvent, 'metaKey' | 'ctrlKey' | 'shiftKey' | 'button'>>;
const click = (init: ClickInit = {}) => {
  const event = { metaKey: false, ctrlKey: false, shiftKey: false, button: 0, ...init, preventDefault: vi.fn() };
  const { result } = renderHook(() => useBackNavigation());
  result.current.onClick(event as unknown as MouseEvent<HTMLAnchorElement>);
  return event;
};

describe('useBackNavigation', () => {
  beforeEach(() => {
    resetNavigation('/classes/c1');
    vi.mocked(canGoBackToList).mockReset();
  });

  it('바로 앞이 목록이면 링크 이동을 막고 history.back 한다', () => {
    vi.mocked(canGoBackToList).mockReturnValue(true);

    const event = click();

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('바로 앞이 목록이 아니면(외부 진입·다른 화면) 링크 기본 동작(홈)을 둔다', () => {
    vi.mocked(canGoBackToList).mockReturnValue(false);

    const event = click();

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
  });

  it.each([
    ['⌘ 클릭', { metaKey: true }],
    ['Ctrl 클릭', { ctrlKey: true }],
    ['Shift 클릭', { shiftKey: true }],
    ['가운데 버튼 클릭', { button: 1 }],
  ])('%s(새 탭·새 창)은 목록에서 왔어도 브라우저 기본 동작에 맡긴다', (_, init) => {
    vi.mocked(canGoBackToList).mockReturnValue(true);

    const event = click(init);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
    expect(canGoBackToList).not.toHaveBeenCalled();
  });
});
