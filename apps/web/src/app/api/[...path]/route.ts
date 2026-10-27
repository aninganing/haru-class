import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE, getApiUrl } from '@/lib/api/config';

// 브라우저 → /api/* → Nest. 토큰을 httpOnly 쿠키에서 꺼내 Bearer 헤더로 붙인다.
// fetch가 응답 본문을 풀어서 주므로 인코딩/길이 관련 헤더는 그대로 넘기지 않는다.
const HOP_BY_HOP = ['connection', 'content-encoding', 'content-length', 'transfer-encoding'];

async function proxy(req: NextRequest, ctx: RouteContext<'/api/[...path]'>) {
  const { path } = await ctx.params;
  const target = `${getApiUrl()}/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers({ accept: 'application/json' });
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (token) headers.set('authorization', `Bearer ${token}`);

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    cache: 'no-store',
  });

  const responseHeaders = new Headers(upstream.headers);
  HOP_BY_HOP.forEach((name) => responseHeaders.delete(name));
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
