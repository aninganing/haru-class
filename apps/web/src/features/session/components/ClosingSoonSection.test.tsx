import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { mockScroll } from '@/test/browser-apis';
import { json, mockFetch } from '@/test/mock-fetch';
import { renderWithQuery } from '@/test/render';
import { ClosingSoonSection } from './ClosingSoonSection';
import { makeClosingSoon } from '@/features/session/fixtures/sessions';
import { CLOSING_SOON_ERROR_MESSAGE } from '@/features/session/constants/messages';

describe('ClosingSoonSection', () => {
  let restore = () => {};
  let calls: string[] = [];
  afterEach(() => restore());
  beforeEach(() => {
    calls = [];
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-27T00:00:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  const serve = (...replies: Array<() => Response | Promise<Response>>) => {
    let n = 0;
    restore = mockFetch((url) => {
      calls.push(url);
      return replies[Math.min(n++, replies.length - 1)]!();
    });
  };

  it('마감 임박 회차를 카드로 보여준다 (잔여석·지역·시간·날짜·가격)', async () => {
    serve(() => json(makeClosingSoon(2)));

    renderWithQuery(<ClosingSoonSection />);

    const list = await screen.findByRole('list', { name: '이번 주 마감 임박' });
    const [first] = within(list).getAllByRole('listitem') as [HTMLElement];
    expect(within(first).getByRole('link', { name: '성수 도자기 원데이클래스' })).toHaveAttribute(
      'href',
      // 상세에서 이 회차를 찾을 수 있게 회차 id를 넘긴다 (T11)
      '/classes/c1?sessionId=s1',
    );
    expect(within(first).getByText('잔여 1석')).toBeInTheDocument();
    expect(within(first).getByText('성수동 · 2시간')).toBeInTheDocument();
    expect(within(first).getByText('10/31(토) 14:00')).toBeInTheDocument();
    expect(within(first).getByText('45,000원')).toBeInTheDocument();
    expect(calls).toEqual(['/api/sessions/closing-soon?limit=10']);
  });

  it('카테고리가 있으면 category 파라미터로 요청한다', async () => {
    serve(() => json(makeClosingSoon(1)));

    renderWithQuery(<ClosingSoonSection category="SCENT" />);

    await screen.findByRole('list', { name: '이번 주 마감 임박' });
    expect(calls).toEqual(['/api/sessions/closing-soon?limit=10&category=SCENT']);
  });

  it('마감 임박 회차가 없으면 섹션을 그리지 않는다', async () => {
    serve(() => json({ items: [] }));

    const { container } = renderWithQuery(<ClosingSoonSection />);

    await vi.waitFor(() => expect(calls).toHaveLength(1));
    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('로딩 중에는 제목과 Skeleton을 보여주고 aria-busy로 표시한다', () => {
    serve(() => new Promise<Response>(() => {}));

    renderWithQuery(<ClosingSoonSection />);

    expect(screen.getByRole('heading', { name: '이번 주 마감 임박' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '이번 주 마감 임박' })).toHaveAttribute('aria-busy', 'true');
  });

  it('실패하면 고정 문구와 "다시 시도"를 보여주고, 누르면 다시 불러온다', async () => {
    serve(
      () => json({ statusCode: 500, message: 'Internal server error' }, 500),
      () => json(makeClosingSoon(1)),
    );

    renderWithQuery(<ClosingSoonSection />);

    expect(await screen.findByText(CLOSING_SOON_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(CLOSING_SOON_ERROR_MESSAGE);
    expect(screen.queryByText('Internal server error')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('link', { name: '성수 도자기 원데이클래스' })).toBeInTheDocument();
    expect(calls).toHaveLength(2);
  });

  it('"다시 시도"를 연타해도 요청은 한 번만 더 간다', async () => {
    serve(
      () => json({ statusCode: 500, message: 'Internal server error' }, 500),
      () => new Promise<Response>(() => {}),
    );

    renderWithQuery(<ClosingSoonSection />);
    const retry = await screen.findByRole('button', { name: '다시 시도' });
    await userEvent.click(retry);
    await userEvent.click(retry);
    await userEvent.click(retry);

    expect(calls).toHaveLength(2);
  });

  it('이전/다음 버튼은 목록을 한 화면씩 가로로 스크롤한다 (키보드로도)', async () => {
    const scroll = mockScroll();
    serve(() => json(makeClosingSoon(5)));

    renderWithQuery(<ClosingSoonSection />);
    const next = await screen.findByRole('button', { name: '다음 마감 임박 클래스' });
    next.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(screen.getByRole('button', { name: '이전 마감 임박 클래스' }));

    expect(scroll.scrollBy).toHaveBeenCalledTimes(2);
    expect(scroll.scrollBy.mock.calls[1]?.[0]).toMatchObject({ left: expect.any(Number) });
    scroll.restore();
  });

  it('접근성 위반이 없다', async () => {
    serve(() => json(makeClosingSoon(3)));
    const { container } = renderWithQuery(<ClosingSoonSection />);
    await screen.findByRole('list', { name: '이번 주 마감 임박' });
    await expectNoA11yViolations(container);
  });
});
