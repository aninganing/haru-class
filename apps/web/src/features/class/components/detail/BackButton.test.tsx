import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetNavigationHistory, useTrackNavigation } from '@/lib/navigation-history';
import { expectNoA11yViolations } from '@/test/a11y';
import { resetNavigation, router } from '@/test/next-navigation';
import { BackButton } from './BackButton';

vi.mock('next/navigation', async () => (await import('@/test/next-navigation')).navigationMock);

// 분기(목록에서 왔을 때만 back, 수정키 클릭 무시)는 useBackNavigation·navigation-history 테스트가 맡는다
describe('BackButton', () => {
  beforeEach(() => {
    resetNavigationHistory();
    resetNavigation('/');
  });

  it('JS 없이도 동작하는 홈 링크이고 "뒤로 가기"로 읽힌다 (보이는 "뒤로"는 중복 낭독하지 않음)', () => {
    render(<BackButton />);

    const link = screen.getByRole('link', { name: '뒤로 가기' });
    expect(link).toHaveAttribute('href', '/');
    expect(screen.getByText('뒤로')).toHaveAttribute('aria-hidden', 'true');
  });

  it('대표 흐름(키보드): 목록에서 들어온 상세에서 Tab → Enter 하면 history.back으로 돌아간다', async () => {
    const { rerender } = renderHook(() => useTrackNavigation());
    window.history.pushState(null, '', '/classes/c1');
    resetNavigation('/classes/c1');
    rerender();

    render(<BackButton />);
    await userEvent.tab();
    expect(screen.getByRole('link', { name: '뒤로 가기' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('접근성 위반이 없다', async () => {
    const { container } = render(<BackButton />);
    await expectNoA11yViolations(container);
  });
});
