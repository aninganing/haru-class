import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { ClosingSoonCard, ClosingSoonCardSkeleton } from './ClosingSoonCard';
import { makeClosingSoonItem } from '@/features/session/fixtures/sessions';

// ClosingSoonSection 테스트가 다루지 않는 카드 단독 표시만 본다 (썸네일 없음, 무료, 연도 표기, 키보드, Skeleton).
const inList = (node: React.ReactNode) => (
  <ul>
    <li>{node}</li>
  </ul>
);

describe('ClosingSoonCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-27T00:00:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('썸네일이 없으면 기본 이미지 영역을 보여준다', () => {
    const base = makeClosingSoonItem();
    const { container } = render(
      inList(<ClosingSoonCard item={{ ...base, class: { ...base.class, thumbnailUrl: null } }} />),
    );

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-thumbnail="placeholder"]')).toBeInTheDocument();
  });

  it('0원 클래스는 "무료"로 보여준다', () => {
    const base = makeClosingSoonItem();
    render(inList(<ClosingSoonCard item={{ ...base, class: { ...base.class, price: 0 } }} />));

    expect(screen.getByText('무료')).toBeInTheDocument();
  });

  it('올해(서울 기준)가 아닌 회차는 연도를 붙여 보여준다', () => {
    render(inList(<ClosingSoonCard item={makeClosingSoonItem({ startsAt: '2027-01-02T05:00:00.000Z' })} />));

    expect(screen.getByText('2027/1/2(토) 14:00')).toBeInTheDocument();
  });

  it('키보드(Tab)로 카드 제목 링크에 포커스가 가고 상세 주소를 가리킨다', async () => {
    render(inList(<ClosingSoonCard item={makeClosingSoonItem()} />));

    await userEvent.tab();

    const link = screen.getByRole('link', { name: '성수 도자기 원데이클래스' });
    expect(link).toHaveFocus();
    // 상세에서 이 회차를 찾을 수 있게 회차 id를 넘긴다 (T11)
    expect(link).toHaveAttribute('href', '/classes/c1?sessionId=s1');
  });

  it('Skeleton은 스크린 리더에 숨긴다', () => {
    const { container } = render(<ClosingSoonCardSkeleton />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('접근성 위반이 없다', async () => {
    const { container } = render(inList(<ClosingSoonCard item={makeClosingSoonItem()} />));
    await expectNoA11yViolations(container);
  });
});
