import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { resetNavigation } from '@/test/next-navigation';
import { BottomTabBar, HeaderNav } from './MainNav';

vi.mock('next/navigation', async () => (await import('@/test/next-navigation')).navigationMock);

describe('BottomTabBar', () => {
  beforeEach(() => resetNavigation('/'));

  it('홈과 내 예약 두 개만 있고, 현재 페이지를 aria-current로 표시한다', () => {
    render(<BottomTabBar />);

    const nav = screen.getByRole('navigation', { name: '하단 메뉴' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['홈', '/'],
      ['내 예약', '/bookings'],
    ]);
    expect(within(nav).getByRole('link', { name: '홈' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: '내 예약' })).not.toHaveAttribute('aria-current');
  });

  it('내 예약 아래 경로에서는 내 예약이 현재 페이지다', () => {
    resetNavigation('/bookings');
    render(<HeaderNav />);

    expect(screen.getByRole('link', { name: '내 예약' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '홈' })).not.toHaveAttribute('aria-current');
  });

  it('접근성 위반이 없다', async () => {
    const { container } = render(
      <>
        <HeaderNav />
        <BottomTabBar />
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
