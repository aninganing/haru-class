import type { ClassListResponse } from '@haru/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { mockIntersectionObserver } from '@/test/intersection-observer';
import { serveClassPages } from '@/test/class-pages';
import { json, mockFetch } from '@/test/mock-fetch';
import { expectNoReactKeyWarnings } from '@/test/react-warnings';
import { renderWithQuery } from '@/test/render';
import { ClassList } from './ClassList';
import { makeClassPage, makeClassSummary } from '@/features/class/fixtures/classes';
import { LOAD_ERROR_MESSAGE, STALE_CURSOR_MESSAGE } from '@/features/class/constants/messages';

const FIRST_URL = '/api/classes?limit=20';
const pageUrl = (cursor: string) => `/api/classes?limit=20&cursor=${cursor}`;

const page1 = makeClassPage(1, 2, 'cursor-2');
const page2 = makeClassPage(3, 2, 'cursor-3');
const lastPage = makeClassPage(5, 1, null);

const serve = serveClassPages;

const cardTitles = () =>
  within(screen.getByRole('list', { name: '새로 열린 클래스' }))
    .getAllByRole('heading', { level: 3 })
    .map((h) => h.textContent);

const status = () => screen.getByRole('status');

describe('ClassList', () => {
  let restore = () => {};
  afterEach(() => restore());
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-27T00:00:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('첫 페이지를 카드(제목 h3 + 상세 링크)로 보여준다', async () => {
    const server = serve({ first: page1 });
    restore = server.restore;

    renderWithQuery(<ClassList />);

    expect(await screen.findByRole('heading', { name: '클래스 1' })).toBeInTheDocument();
    expect(cardTitles()).toEqual(['클래스 1', '클래스 2']);
    expect(screen.getByRole('link', { name: '클래스 1' })).toHaveAttribute('href', '/classes/c1');
  });

  it('첫 로딩 중에는 Skeleton을 보여주고 목록을 aria-busy로 표시한다', () => {
    restore = mockFetch(() => new Promise<Response>(() => {}));

    renderWithQuery(<ClassList />);

    expect(screen.getByRole('list', { name: '새로 열린 클래스' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it('대표 흐름: 목록 끝(sentinel)이 보이면 다음 cursor로 불러와 카드를 붙이고 status로 알린다', async () => {
    const io = mockIntersectionObserver();
    const server = serve({ first: page1, 'cursor-2': page2 });
    restore = server.restore;

    renderWithQuery(<ClassList />);
    await screen.findByRole('heading', { name: '클래스 1' });
    expect(io.active[0]?.rootMargin).toBe('0px 0px 200px 0px');

    io.enter();

    expect(await screen.findByRole('heading', { name: '클래스 3' })).toBeInTheDocument();
    expect(cardTitles()).toEqual(['클래스 1', '클래스 2', '클래스 3', '클래스 4']);
    expect(server.calls).toEqual([FIRST_URL, pageUrl('cursor-2')]);
    expect(status()).toHaveTextContent('클래스 2개를 더 불러왔어요');
  });

  it('키보드로 "더 보기"를 누르면 다음 페이지를 불러오고 새로 붙은 첫 항목으로 포커스를 옮긴다', async () => {
    const server = serve({ first: page1, 'cursor-2': page2 });
    restore = server.restore;

    renderWithQuery(<ClassList />);
    await screen.findByRole('heading', { name: '클래스 1' });

    await userEvent.tab(); // 클래스 1
    await userEvent.tab(); // 클래스 2
    await userEvent.tab(); // 더 보기
    const button = screen.getByRole('button', { name: '더 보기' });
    expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { name: '클래스 3' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('link', { name: '클래스 3' })).toHaveFocus());
  });

  it('"더 보기" 로딩 중에는 버튼을 막지 않고 aria-busy와 Spinner(300ms 뒤)를 보여준다', async () => {
    const server = serve({ first: page1, 'cursor-2': new Promise<Response>(() => {}) });
    restore = server.restore;

    renderWithQuery(<ClassList />);
    const more = await screen.findByRole('button', { name: '더 보기' });
    await userEvent.click(more);

    expect(more).toHaveAttribute('aria-busy', 'true');
    expect(more).toBeEnabled();
    // 빠른 응답은 깜빡이지 않게 300ms 뒤에야 그린다
    expect(screen.queryByText('클래스를 불러오는 중')).not.toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(350);
    expect(await screen.findByText('클래스를 불러오는 중')).toBeInTheDocument();
  });

  it('첫 페이지가 마지막이면 끝 문구를 보여주고 버튼을 두지 않는다', async () => {
    const server = serve({ first: lastPage });
    restore = server.restore;

    renderWithQuery(<ClassList />);

    expect(await screen.findByText('모든 클래스를 다 봤어요')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('다음 페이지가 실패하면 고정 문구(Badge·status)와 "다시 시도"를 보여주고 서버 문구는 숨긴다', async () => {
    const server = serve({
      first: page1,
      'cursor-2': json({ statusCode: 500, message: 'Internal server error' }, 500),
    });
    restore = server.restore;

    renderWithQuery(<ClassList />);
    await userEvent.click(await screen.findByRole('button', { name: '더 보기' }));

    expect(await screen.findByText(LOAD_ERROR_MESSAGE, { selector: 'span' })).toBeInTheDocument();
    expect(status()).toHaveTextContent(LOAD_ERROR_MESSAGE);
    expect(screen.queryByText('Internal server error')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
    // 기존 카드는 그대로 남는다
    expect(cardTitles()).toEqual(['클래스 1', '클래스 2']);
  });

  it('400(잘못된 cursor)이면 안내 문구가 바뀌고, 키보드로 "다시 시도"하면 처음부터 다시 그리며 같은 버튼에 포커스가 남는다', async () => {
    const io = mockIntersectionObserver();
    const fresh = makeClassPage(11, 2, 'cursor-fresh');
    const server = serve({
      first: [page1, fresh],
      'cursor-2': json({ statusCode: 400, message: 'Validation failed', error: 'Bad Request' }, 400),
    });
    restore = server.restore;

    renderWithQuery(<ClassList />);
    await screen.findByRole('heading', { name: '클래스 1' });
    io.enter();

    expect(await screen.findByText(STALE_CURSOR_MESSAGE, { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByText(/Validation failed/)).not.toBeInTheDocument();

    const retry = screen.getByRole('button', { name: '다시 시도' });
    retry.focus();
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { name: '클래스 11' })).toBeInTheDocument();
    expect(cardTitles()).toEqual(['클래스 11', '클래스 12']);
    // 같은 버튼 요소가 "더 보기"로 바뀌어 포커스가 남는다
    expect(screen.getByRole('button', { name: '더 보기' })).toHaveFocus();
  });

  it('첫 페이지가 실패하면 고정 문구와 "다시 시도"를 보여주고, 누르면 다시 불러온다', async () => {
    const server = serve({ first: [json({ statusCode: 502, message: 'Bad Gateway' }, 502), page1] });
    restore = server.restore;

    renderWithQuery(<ClassList />);

    expect(await screen.findByText(LOAD_ERROR_MESSAGE)).toBeInTheDocument();
    // 스크린 리더가 바로 알 수 있게 alert로 알린다
    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR_MESSAGE);
    expect(screen.queryByText('Bad Gateway')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('heading', { name: '클래스 1' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('클래스가 없으면 빈 상태 문구를 보여주고 버튼을 두지 않는다', async () => {
    const server = serve({ first: { items: [], nextCursor: null } });
    restore = server.restore;

    renderWithQuery(<ClassList />);

    expect(await screen.findByText('아직 열린 클래스가 없어요')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('모든 클래스를 다 봤어요')).not.toBeInTheDocument();
  });

  it('신규 클래스에만 "신규 오픈" 배지를 붙이고, 정원을 모르면 메타에서 뺀다', async () => {
    const server = serve({
      first: {
        items: [
          makeClassSummary({
            id: 'a',
            title: '새 클래스',
            isNew: true,
            maxCapacity: 8,
            durationMinutes: 180,
            neighborhood: '망원동',
          }),
          makeClassSummary({ id: 'b', title: '오래된 클래스', isNew: false, maxCapacity: null }),
        ],
        nextCursor: null,
      },
    });
    restore = server.restore;

    renderWithQuery(<ClassList />);

    const [fresh, old] = (await screen.findAllByRole('article')) as [HTMLElement, HTMLElement];
    expect(within(fresh).getByText('신규 오픈')).toBeInTheDocument();
    expect(within(fresh).getByText('망원동 · 3시간 · 최대 8명')).toBeInTheDocument();
    expect(within(old).queryByText('신규 오픈')).not.toBeInTheDocument();
    expect(within(old).getByText('성수동 · 2시간')).toBeInTheDocument();
  });

  describe('페이지 사이 중복 (제거·개수 로직은 훅 테스트, 여기서는 렌더링만)', () => {
    // page1 = [c1, c2], 다음 페이지는 c2(중복) + c3
    const overlapping: ClassListResponse = {
      items: [makeClassSummary({ id: 'c2', title: '클래스 2' }), makeClassSummary({ id: 'c3', title: '클래스 3' })],
      nextCursor: null,
    };

    it('이미 본 클래스가 섞여 오면 한 번만 보여주고 key 경고가 없다', async () => {
      const server = serve({ first: page1, 'cursor-2': overlapping });
      restore = server.restore;

      await expectNoReactKeyWarnings(async () => {
        renderWithQuery(<ClassList />);
        await userEvent.click(await screen.findByRole('button', { name: '더 보기' }));
        expect(await screen.findByRole('heading', { name: '클래스 3' })).toBeInTheDocument();
      });
      expect(cardTitles()).toEqual(['클래스 1', '클래스 2', '클래스 3']);
    });
  });

  it('다음 페이지 실패 상태에서도 접근성 위반이 없다', async () => {
    const server = serve({ first: page1, 'cursor-2': json({ statusCode: 500, message: 'x' }, 500) });
    restore = server.restore;

    const { container } = renderWithQuery(<ClassList />);
    await userEvent.click(await screen.findByRole('button', { name: '더 보기' }));
    await screen.findByRole('button', { name: '다시 시도' });

    await expectNoA11yViolations(container);
  });

  it('버튼으로 끝까지 불러와 끝 문구에 포커스가 간 상태에서도 접근성 위반이 없다', async () => {
    const server = serve({ first: page1, 'cursor-2': lastPage });
    restore = server.restore;

    const { container } = renderWithQuery(<ClassList />);
    await userEvent.click(await screen.findByRole('button', { name: '더 보기' }));
    const end = await screen.findByText('모든 클래스를 다 봤어요');
    await waitFor(() => expect(end).toHaveFocus());

    await expectNoA11yViolations(container);
  });

  it('접근성 위반이 없다', async () => {
    const server = serve({ first: page1 });
    restore = server.restore;

    const { container } = renderWithQuery(<ClassList />);
    await screen.findByRole('heading', { name: '클래스 1' });
    await expectNoA11yViolations(container);
  });
});
