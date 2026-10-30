import { REFUND_POLICY } from '@haru/contracts';
import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { resetNavigation } from '@/test/next-navigation';
import { ClassDetailView } from './ClassDetailView';
import { makeClassDetail, makeSession } from '@/features/class/fixtures/classes';

vi.mock('next/navigation', async () => (await import('@/test/next-navigation')).navigationMock);

const factValue = (term: string) => screen.getByText(term, { selector: 'dt' }).nextElementSibling?.textContent;

describe('ClassDetailView', () => {
  beforeEach(() => {
    resetNavigation('/classes/c1');
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-27T00:00:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('제목(h1)·카테고리·태그·공방·1인 가격을 보여준다', () => {
    render(<ClassDetailView detail={makeClassDetail()} />);

    expect(screen.getByRole('heading', { level: 1, name: '성수 도자기 원데이클래스' })).toBeInTheDocument();
    expect(screen.getByText('공예')).toBeInTheDocument();
    expect(screen.getByText('입문자 추천')).toBeInTheDocument();
    expect(screen.getByText('흙과손 공방')).toBeInTheDocument();
    expect(screen.getAllByText((_, el) => el?.tagName === 'P' && el.textContent === '45,000원 / 1인').length).toBeGreaterThan(0);
  });

  it('정보 4칸: 소요 시간·정원·위치·난이도', () => {
    render(<ClassDetailView detail={makeClassDetail()} />);

    expect(factValue('소요 시간')).toBe('2시간');
    expect(factValue('정원')).toBe('회차당 최대 6명');
    expect(factValue('위치')).toBe('성수역 3번 출구 5분');
    expect(factValue('난이도')).toBe('입문');
  });

  it('정원을 모르면(maxCapacity null) "회차 준비 중"으로 보여준다', () => {
    render(<ClassDetailView detail={makeClassDetail({ maxCapacity: null })} />);

    expect(factValue('정원')).toBe('회차 준비 중');
  });

  it('회차 선택하기 CTA는 회차 선택 화면으로 연결하고, 환불 규정을 보여준다', () => {
    render(<ClassDetailView detail={makeClassDetail()} />);

    expect(screen.getByRole('link', { name: '회차 선택하기' })).toHaveAttribute('href', '/classes/c1/sessions');
    const refund = screen.getByRole('region', { name: '환불 규정' });
    expect(within(refund).getAllByRole('listitem').map((li) => li.textContent)).toEqual([...REFUND_POLICY]);
  });

  it('예약 가능한 회차가 없으면 CTA 대신 이유를 보여준다', () => {
    render(
      <ClassDetailView
        detail={makeClassDetail({ sessions: [makeSession({ remaining: 0, status: 'SOLD_OUT' })], maxCapacity: null })}
      />,
    );

    expect(screen.queryByRole('link', { name: '회차 선택하기' })).not.toBeInTheDocument();
    // 매진 회차 하나뿐이라 목록은 "마감" 행을 보여주고, CTA 자리에만 이유 문구가 있다
    const booking = within(screen.getByRole('complementary', { name: '예약' }));
    expect(booking.getByText('마감')).toBeInTheDocument();
    expect(booking.getByText('예정된 회차가 없어요')).toBeInTheDocument();
  });

  it('회차가 하나도 없으면 다가오는 회차에 빈 상태를 보여준다', () => {
    render(<ClassDetailView detail={makeClassDetail({ sessions: [] })} />);

    expect(within(screen.getByRole('region', { name: '다가오는 회차' })).getByText('예정된 회차가 없어요')).toBeInTheDocument();
  });

  it('접근성 위반이 없다', async () => {
    const { container } = render(<ClassDetailView detail={makeClassDetail()} />);
    await expectNoA11yViolations(container);
  });
});
