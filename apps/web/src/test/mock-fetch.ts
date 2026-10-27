type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/**
 * 전역 fetch를 바꿔치기하고, 되돌리는 함수를 반환한다.
 * 테스트(vi.stubGlobal 대신)와 Storybook의 beforeEach에서 같이 쓴다.
 */
export function mockFetch(handler: Handler) {
  const original = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return Promise.resolve(handler(url, init));
  };
  return () => {
    globalThis.fetch = original;
  };
}
