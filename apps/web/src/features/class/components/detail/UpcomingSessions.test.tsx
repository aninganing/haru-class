import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { makeClassDetail, makeSession } from '@/features/class/fixtures/classes';
import { UpcomingSessions } from './UpcomingSessions';

const sessions = makeClassDetail().sessions;

describe('UpcomingSessions', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-27T00:00:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('회차를 날짜·시간·잔여석으로 보여주고, 예약 가능한 행은 회차 선택으로 연결한다', () => {
    render(<UpcomingSessions classId="c1" sessions={sessions} />);

    const [first, second] = screen.getAllByRole('listitem') as [HTMLElement, HTMLElement];
    const link = within(first).getByRole('link');
    expect(link).toHaveAttribute('href', '/classes/c1/sessions?sessionId=s1');
    expect(link).toHaveTextContent('10/31(토)14:00 – 16:00잔여 1석');
    expect(within(second).getByText('잔여 4석')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '전체 일정' })).toHaveAttribute('href', '/classes/c1/sessions');
  });

  it('매진 회차는 링크가 아니고 "마감"으로 보여준다', () => {
    render(<UpcomingSessions classId="c1" sessions={sessions} />);

    const soldOut = screen.getAllByRole('listitem')[2]!;
    expect(within(soldOut).queryByRole('link')).not.toBeInTheDocument();
    expect(within(soldOut).getByText('마감')).toBeInTheDocument();
  });

  it('상태가 OPEN이어도 잔여 0이면 배지와 같이 "마감"이고 링크가 아니다', () => {
    render(<UpcomingSessions classId="c1" sessions={[makeSession({ remaining: 0, status: 'OPEN' })]} />);

    const row = screen.getByRole('listitem');
    expect(within(row).getByText('마감')).toBeInTheDocument();
    expect(within(row).queryByRole('link')).not.toBeInTheDocument();
  });

  describe('선택한 회차 (마감 임박 카드에서 ?sessionId=로 들어옴, T11)', () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      makeSession({
        id: `s${i}`,
        startsAt: new Date(Date.UTC(2026, 10, 1 + i, 5)).toISOString(),
        endsAt: new Date(Date.UTC(2026, 10, 1 + i, 7)).toISOString(),
        remaining: 5,
      }),
    );

    it('앞 3개 밖의 회차여도 목록에 포함하고 "선택한 회차"로 표시한다 (색만으로 구분하지 않음)', () => {
      render(<UpcomingSessions classId="c1" sessions={many} selectedSessionId="s4" />);

      const rows = screen.getAllByRole('listitem');
      expect(rows).toHaveLength(4);
      const selected = rows[3]!;
      expect(selected).toHaveTextContent('11/5(목)');
      expect(within(selected).getByText('선택한 회차')).toBeInTheDocument();
      expect(within(selected).getByRole('link')).toHaveAttribute('aria-current', 'true');
      expect(within(selected).getByRole('link')).toHaveAttribute('href', '/classes/c1/sessions?sessionId=s4');
    });

    it('앞 3개 안의 회차면 개수는 그대로 두고 그 행만 표시한다', () => {
      render(<UpcomingSessions classId="c1" sessions={many} selectedSessionId="s1" />);

      expect(screen.getAllByRole('listitem')).toHaveLength(3);
      expect(screen.getAllByText('선택한 회차')).toHaveLength(1);
      expect(within(screen.getAllByRole('listitem')[1]!).getByText('선택한 회차')).toBeInTheDocument();
    });

    it('없는 회차·매진 회차면 무시하고 평소대로 보여준다', () => {
      const withSoldOut = [...many, makeSession({ id: 'gone', remaining: 0, status: 'SOLD_OUT' })];
      const { rerender } = render(<UpcomingSessions classId="c1" sessions={withSoldOut} selectedSessionId="nope" />);
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
      expect(screen.queryByText('선택한 회차')).not.toBeInTheDocument();

      rerender(<UpcomingSessions classId="c1" sessions={withSoldOut} selectedSessionId="gone" />);
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
      expect(screen.queryByText('선택한 회차')).not.toBeInTheDocument();
    });
  });

  it('최대 3개까지만 보여준다', () => {
    const many = Array.from({ length: 5 }, (_, i) => makeSession({ id: `s${i}`, remaining: 5 }));
    render(<UpcomingSessions classId="c1" sessions={many} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('회차가 없으면 "예정된 회차가 없어요"를 보여주고 전체 일정 링크도 없다', () => {
    render(<UpcomingSessions classId="c1" sessions={[]} />);

    expect(screen.getByText('예정된 회차가 없어요')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('접근성 위반이 없다', async () => {
    const { container } = render(<UpcomingSessions classId="c1" sessions={sessions} />);
    await expectNoA11yViolations(container);
  });
});
