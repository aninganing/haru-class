import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { ClassInfoTabs } from './ClassInfoTabs';
import { makeClassDetail } from '@/features/class/fixtures/classes';

const detail = makeClassDetail();

describe('ClassInfoTabs', () => {
  it('소개 탭에 설명·배우는 것·포함 사항을 보여준다', () => {
    render(<ClassInfoTabs detail={detail} />);

    expect(screen.getByRole('tab', { name: '소개' })).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('흙을 처음 만지는 분도');
    expect(screen.getByRole('heading', { name: '이런 걸 배워요' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(detail.learnings);
    expect(screen.getByText('재료비, 유약, 소성비, 앞치마 대여 · 택배비 별도')).toBeInTheDocument();
  });

  it('선택되지 않은 탭 내용도 DOM에 있되 숨겨져 있다 (SSR·SEO)', () => {
    const { container } = render(<ClassInfoTabs detail={detail} />);

    const panels = container.querySelectorAll('[role="tabpanel"]');
    expect(panels).toHaveLength(4);
    expect([...panels].map((p) => p.hasAttribute('hidden'))).toEqual([false, true, true, true]);
    expect(container).toHaveTextContent('공방 소개와 흙 다루기');
    expect(container).toHaveTextContent('성수역 3번 출구 5분');
  });

  it('방향키로 탭을 옮기면 바로 그 탭이 보인다 (커리큘럼 0:20 형식)', async () => {
    render(<ClassInfoTabs detail={detail} />);

    await userEvent.tab();
    expect(screen.getByRole('tab', { name: '소개' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: '커리큘럼' })).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('0:20형태 만들기');
    expect(panel).toHaveTextContent('1:20손잡이와 마감');
  });

  it('위치 탭은 주소와 찾아오는 길, 후기 탭은 빈 상태를 보여준다', async () => {
    render(<ClassInfoTabs detail={detail} />);

    await userEvent.click(screen.getByRole('tab', { name: '위치' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('서울 성동구 성수이로 123 2층성수역 3번 출구 5분');

    await userEvent.click(screen.getByRole('tab', { name: '후기' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('아직 후기가 없어요');
  });

  it('접근성 위반이 없다', async () => {
    const { container } = render(<ClassInfoTabs detail={detail} />);
    await expectNoA11yViolations(container);
  });
});
