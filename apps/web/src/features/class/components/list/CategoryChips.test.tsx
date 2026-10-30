import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { resetNavigation, router } from '@/test/next-navigation';
import { CategoryChips } from './CategoryChips';

vi.mock('next/navigation', async () => (await import('@/test/next-navigation')).navigationMock);

describe('CategoryChips', () => {
  beforeEach(() => resetNavigation('/'));

  it('전체와 5개 카테고리를 보여주고 현재 선택을 aria-pressed로 표시한다', () => {
    render(<CategoryChips category="COOKING" />);

    const group = screen.getByRole('group', { name: '카테고리' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      '전체',
      '공예',
      '요리·베이킹',
      '드로잉',
      '플라워',
      '향·캔들',
    ]);
    expect(screen.getByRole('button', { name: '요리·베이킹' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('선택된 칩을 다시 누르면 전체로 돌아간다', async () => {
    render(<CategoryChips category="CRAFT" />);

    await userEvent.click(screen.getByRole('button', { name: '공예' }));

    expect(router.push).toHaveBeenCalledWith('/', { scroll: false });
  });

  it('키보드(Tab, Space)로 카테고리를 고를 수 있다', async () => {
    render(<CategoryChips />);

    await userEvent.tab(); // 전체
    await userEvent.tab(); // 공예
    await userEvent.tab(); // 요리·베이킹
    expect(screen.getByRole('button', { name: '요리·베이킹' })).toHaveFocus();
    await userEvent.keyboard(' ');

    expect(router.push).toHaveBeenCalledWith('/?category=COOKING', { scroll: false });
  });

  it('카테고리가 바뀌면 훅의 안내를 칩 위 status 영역에 보여준다', () => {
    const { rerender } = render(<CategoryChips />);
    expect(screen.getByRole('status')).toHaveTextContent('');

    rerender(<CategoryChips category="FLOWER" />);

    expect(screen.getByRole('status')).toHaveTextContent('플라워 클래스를 보여드려요');
  });

  it('접근성 위반이 없다', async () => {
    const { container } = render(<CategoryChips category="SCENT" />);
    await expectNoA11yViolations(container);
  });
});
