import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { LOAD_ERROR_MESSAGE, STALE_CURSOR_MESSAGE } from '@/features/class/constants/messages';
import { makeClassPage, makeClassSummary } from '@/features/class/fixtures/classes';
import { keys } from '@/lib/query/keys';
import { serveClassPages } from '@/test/class-pages';
import { json } from '@/test/mock-fetch';
import { createTestQueryClient } from '@/test/render';
import { useClassListFeed } from './useClassListFeed';

const page1 = makeClassPage(1, 2, 'cursor-2');

const serve = serveClassPages;

function setup(category?: Parameters<typeof useClassListFeed>[0], queryClient = createTestQueryClient()) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(() => useClassListFeed(category), { wrapper }) };
}

describe('useClassListFeed', () => {
  let restore = () => {};
  afterEach(() => restore());

  it('첫 로딩 중에는 버튼 자리를 busy "더 보기"로 두고, 다음 페이지가 있으면 누를 수 있는 "더 보기"가 된다', async () => {
    const server = serve({ first: [() => json(page1)] });
    restore = server.restore;
    const { result } = setup();

    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.footerButton).toMatchObject({ label: '더 보기', busy: true });

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.footerButton).toMatchObject({ label: '더 보기', busy: false });
    expect(result.current.canAutoLoad).toBe(true);
    expect(result.current.isEnd).toBe(false);
  });

  it('페이지를 이어 붙이고 중복 id를 빼며, 마지막 페이지면 끝·버튼 없음·자동 로드 끔', async () => {
    const overlapping = {
      items: [makeClassSummary({ id: 'c2', title: '클래스 2' }), makeClassSummary({ id: 'c3', title: '클래스 3' })],
      nextCursor: null,
    };
    const server = serve({ first: [() => json(page1)], 'cursor-2': [() => json(overlapping)] });
    restore = server.restore;
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    act(() => result.current.loadMore('button'));

    await waitFor(() => expect(result.current.pageCount).toBe(2));
    expect(result.current.items.map((i) => i.id)).toEqual(['c1', 'c2', 'c3']);
    expect(result.current.trigger).toBe('button');
    expect(result.current.isEnd).toBe(true);
    expect(result.current.footerButton).toBeNull();
    expect(result.current.canAutoLoad).toBe(false);
  });

  it('요청 중에 loadMore를 다시 불러도 한 번만 요청한다', async () => {
    let resolve: (r: Response) => void = () => {};
    const server = serve({
      first: [() => json(page1)],
      'cursor-2': [() => new Promise<Response>((r) => (resolve = r))],
    });
    restore = server.restore;
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    act(() => result.current.loadMore('auto'));
    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(true));
    // 요청 중에는 자동 로드를 끈다 (sentinel이 다시 보여도 부르지 않음)
    expect(result.current.canAutoLoad).toBe(false);
    act(() => result.current.loadMore('button'));
    resolve(json(makeClassPage(3, 1, null)));

    await waitFor(() => expect(result.current.pageCount).toBe(2));
    expect(server.calls.filter((u) => u.includes('cursor=cursor-2'))).toHaveLength(1);
    expect(result.current.trigger).toBe('auto');
  });

  it('첫 페이지 실패는 isInitialError이고 버튼 자리는 비우며, retry는 첫 페이지를 다시 요청한다', async () => {
    const server = serve({ first: [() => json({ statusCode: 502, message: 'Bad Gateway' }, 502), () => json(page1)] });
    restore = server.restore;
    const { result } = setup();

    await waitFor(() => expect(result.current.isInitialError).toBe(true));
    expect(result.current.footerButton).toBeNull();
    expect(result.current.nextErrorMessage).toBeNull();

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(server.calls).toEqual(['/api/classes?limit=20', '/api/classes?limit=20']);
  });

  it('다음 페이지 5xx는 같은 cursor로, 400은 이 카테고리 목록만 처음부터 다시 불러온다', async () => {
    const server = serve({
      first: [() => json(page1), () => json(makeClassPage(11, 1, null))],
      'cursor-2': [
        () => json({ statusCode: 500, message: 'x' }, 500),
        () => json({ statusCode: 400, message: 'x' }, 400),
      ],
    });
    restore = server.restore;
    const { result, queryClient } = setup('CRAFT');
    const other = { pages: [makeClassPage(90, 1, null)], pageParams: [null] };
    queryClient.setQueryData(keys.class.list('FLOWER'), other);
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    // 5xx → 같은 cursor로 다시 (이번엔 400이 온다)
    act(() => result.current.loadMore('auto'));
    await waitFor(() => expect(result.current.nextErrorMessage).toBe(LOAD_ERROR_MESSAGE));
    expect(result.current.canAutoLoad).toBe(false);
    expect(result.current.footerButton).toMatchObject({ label: '다시 시도' });
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.nextErrorMessage).toBe(STALE_CURSOR_MESSAGE));

    // 400 → 처음부터
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual(['c11']));
    expect(server.calls).toEqual([
      '/api/classes?limit=20&category=CRAFT',
      '/api/classes?limit=20&category=CRAFT&cursor=cursor-2',
      '/api/classes?limit=20&category=CRAFT&cursor=cursor-2',
      '/api/classes?limit=20&category=CRAFT',
    ]);
    expect(queryClient.getQueryData(keys.class.list('FLOWER'))).toEqual(other);
  });
  it('첫 요청은 /api/classes?limit=20이고, 서버에서 받은(hydrate된) 첫 페이지가 있으면 다시 요청하지 않는다', async () => {
    const fresh = serve({ first: [() => json(page1)] });
    const first = setup();
    await waitFor(() => expect(first.result.current.items).toHaveLength(2));
    expect(fresh.calls).toEqual(['/api/classes?limit=20']);
    fresh.restore();

    const server = serve({ first: [() => json(page1)] });
    restore = server.restore;
    const queryClient = createTestQueryClient();
    // 앱 QueryClient(get-query-client.ts)와 같은 staleTime. hydrate 직후 다시 요청하지 않는 근거다.
    queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 30_000 } });
    queryClient.setQueryData(keys.class.list(), { pages: [page1], pageParams: [null] });
    const { result } = setup(undefined, queryClient);

    expect(result.current.items).toHaveLength(2);
    expect(result.current.isInitialLoading).toBe(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(server.calls).toEqual([]);
  });

  it('클래스가 없으면 isEmpty이고 끝이며 버튼 자리를 비운다', async () => {
    const server = serve({ first: [() => json({ items: [], nextCursor: null })] });
    restore = server.restore;
    const { result } = setup();

    await waitFor(() => expect(result.current.isEmpty).toBe(true));
    expect(result.current.isEnd).toBe(true);
    expect(result.current.footerButton).toBeNull();
    expect(result.current.canAutoLoad).toBe(false);
  });

  it('첫 페이지가 마지막이면 끝이고 버튼·자동 로드가 없다', async () => {
    const server = serve({ first: [() => json(makeClassPage(1, 1, null))] });
    restore = server.restore;
    const { result } = setup();

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.isEnd).toBe(true);
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.footerButton).toBeNull();
    expect(result.current.canAutoLoad).toBe(false);
  });

  it('5xx 뒤 retry가 성공하면 에러가 풀리고 "더 보기"·자동 로드가 다시 켜진다', async () => {
    const server = serve({
      first: [() => json(page1)],
      'cursor-2': [
        () => json({ statusCode: 500, message: 'Internal server error' }, 500),
        () => json(makeClassPage(3, 2, 'cursor-3')),
      ],
    });
    restore = server.restore;
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    act(() => result.current.loadMore('auto'));
    await waitFor(() => expect(result.current.nextErrorMessage).toBe(LOAD_ERROR_MESSAGE));
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.items).toHaveLength(4));
    expect(result.current.nextErrorMessage).toBeNull();
    expect(result.current.footerButton).toMatchObject({ label: '더 보기', busy: false });
    expect(result.current.canAutoLoad).toBe(true);
    expect(result.current.trigger).toBe('button');
    expect(server.calls.filter((u) => u.includes('cursor=cursor-2'))).toHaveLength(2);
  });

  it('네트워크 오류(fetch reject)도 5xx와 같은 고정 문구와 "다시 시도"', async () => {
    const server = serve({
      first: [() => json(page1)],
      'cursor-2': [() => Promise.reject(new TypeError('Failed to fetch'))],
    });
    restore = server.restore;
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    act(() => result.current.loadMore('button'));

    await waitFor(() => expect(result.current.nextErrorMessage).toBe(LOAD_ERROR_MESSAGE));
    expect(result.current.footerButton).toMatchObject({ label: '다시 시도' });
    expect(result.current.isInitialError).toBe(false);
  });

  it('다음 페이지가 전부 중복이어도 nextCursor가 있으면 "더 보기"가 남고 다음 cursor로 이어진다', async () => {
    const server = serve({
      first: [() => json(page1)],
      'cursor-2': [() => json({ items: page1.items, nextCursor: 'cursor-3' })],
      'cursor-3': [() => json(makeClassPage(3, 1, null))],
    });
    restore = server.restore;
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    act(() => result.current.loadMore('button'));
    await waitFor(() => expect(result.current.pageCount).toBe(2));
    expect(result.current.items.map((i) => i.id)).toEqual(['c1', 'c2']);
    expect(result.current.footerButton).toMatchObject({ label: '더 보기', busy: false });

    act(() => result.current.loadMore('button'));
    await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual(['c1', 'c2', 'c3']));
    expect(server.calls).toEqual([
      '/api/classes?limit=20',
      '/api/classes?limit=20&cursor=cursor-2',
      '/api/classes?limit=20&cursor=cursor-3',
    ]);
  });

  it('retry 요청이 진행 중이면 다시 불러도 무시한다 (연타)', async () => {
    const server = serve({
      first: [() => json(page1)],
      'cursor-2': [() => json({ statusCode: 500, message: 'x' }, 500), () => new Promise<Response>(() => {})],
    });
    restore = server.restore;
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    act(() => result.current.loadMore('button'));
    await waitFor(() => expect(result.current.nextErrorMessage).toBe(LOAD_ERROR_MESSAGE));

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.isFetching).toBe(true));
    expect(result.current.footerButton).toMatchObject({ label: '다시 시도', busy: true });
    act(() => result.current.retry());
    act(() => result.current.retry());

    expect(server.calls.filter((u) => u.includes('cursor=cursor-2'))).toHaveLength(2);
  });
});
