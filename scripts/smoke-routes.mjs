#!/usr/bin/env node
// 실행 중인 dev 서버(web :3000, api :4000)의 주요 라우트가 기대한 HTTP 상태를 돌려주는지 확인한다.
// 서버 컴포넌트 런타임 오류(예: 클라이언트 모듈 함수를 서버에서 호출)는 단위 테스트·Storybook·build가
// 잡지 못하므로 실제 요청으로 확인한다. 사용: pnpm smoke
//   exit 0 = 모두 통과, 1 = 실패 있음, 2 = 서버가 떠 있지 않아 건너뜀

const WEB = process.env.WEB_URL ?? 'http://localhost:3000';
const API = process.env.API_URL ?? 'http://localhost:4000';
// 형식은 맞지만 존재하지 않는 cuid
const MISSING_ID = 'cmhx0abcd0000a1b2c3d4e5f6';

const get = (url) => fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30_000) });

async function main() {
  try {
    await get(`${API}/health`);
    await get(`${WEB}/api/health`);
  } catch {
    console.log(`건너뜀: ${WEB} 또는 ${API}가 응답하지 않아요 (pnpm dev 실행 후 다시)`);
    process.exit(2);
  }

  const first = await get(`${API}/classes?limit=1`).then((res) => res.json());
  const id = first.items?.[0]?.id;

  const checks = [
    ['/', 200],
    ['/?category=CRAFT', 200],
    ['/?category=unknown', 200],
    ...(id
      ? [
          [`/classes/${id}`, 200],
          [`/classes/${id}/sessions`, 200],
        ]
      : []),
    [`/classes/${MISSING_ID}`, 404],
    ['/classes/bad-id', 404],
    ['/bookings', 200],
    ['/status', 200],
    ['/api/health', 200],
    ['/api/classes?limit=1', 200],
    ['/api/sessions/closing-soon', 200],
  ];

  let failed = 0;
  for (const [path, expected] of checks) {
    const res = await get(`${WEB}${path}`);
    const ok = res.status === expected;
    if (!ok) failed += 1;
    console.log(`${ok ? '✅' : '❌'} ${res.status} ${path}${ok ? '' : ` (기대 ${expected})`}`);
  }
  if (!id) console.log('⚠️ 클래스가 없어 상세 라우트를 건너뛰었어요 (pnpm db:seed)');

  console.log(failed ? `\n실패 ${failed}건` : `\n모두 통과 (${checks.length}건)`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
