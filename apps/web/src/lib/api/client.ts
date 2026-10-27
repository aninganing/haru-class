import { ACCESS_TOKEN_COOKIE, getApiUrl } from './config';
import { ApiError } from './error';

const isServer = typeof window === 'undefined';

/**
 * 서버/브라우저 겸용 API 클라이언트.
 * - 서버(RSC, Server Action, prefetch): Nest를 직접 호출하고 쿠키의 토큰을 Bearer로 붙인다.
 * - 브라우저(useQuery): 같은 출처의 /api 프록시를 호출한다. 토큰은 프록시가 붙인다.
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');

  let url: string;
  if (isServer) {
    const { cookies } = await import('next/headers');
    const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
    if (token) headers.set('authorization', `Bearer ${token}`);
    url = `${getApiUrl()}${path}`;
  } else {
    url = `/api${path}`;
  }

  const res = await fetch(url, { cache: 'no-store', ...init, headers });
  if (!res.ok) throw await ApiError.from(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'DELETE' }),
};
