import type { ClassListResponse } from '@haru/contracts';
import { json, mockFetch } from './mock-fetch';

/** 한 번의 응답: 목록 본문(200), Response, 대기 중 Promise, 또는 호출될 때 만드는 함수 */
export type ClassPageReply = ClassListResponse | Response | Promise<Response> | (() => Response | Promise<Response>);

/**
 * `/api/classes` 요청에 cursor별로 응답한다. 첫 페이지(cursor 없음)의 키는 'first'.
 * 값이 배열이면 같은 cursor 요청에 호출 순서대로 하나씩 쓰고, 마지막 것을 반복한다. 없는 cursor는 404.
 * 반환한 calls에 요청 URL이 쌓이고, restore로 fetch를 되돌린다.
 */
export function serveClassPages(routes: Record<string, ClassPageReply | ClassPageReply[]>) {
  const calls: string[] = [];
  const counts: Record<string, number> = {};
  const restore = mockFetch((url) => {
    calls.push(url);
    const cursor = new URL(url, 'http://localhost').searchParams.get('cursor') ?? 'first';
    const route = routes[cursor];
    if (route === undefined) return json({ statusCode: 404, message: 'no route' }, 404);
    const n = counts[cursor] ?? 0;
    counts[cursor] = n + 1;
    const reply = Array.isArray(route) ? route[Math.min(n, route.length - 1)]! : route;
    if (typeof reply === 'function') return reply();
    return reply instanceof Response || reply instanceof Promise ? reply : json(reply);
  });
  return { calls, restore };
}
