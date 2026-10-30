---
name: write-tests
description: haru-class의 테스트 작성 가이드. 계층별로 무엇을 어떤 도구로 테스트할지(contracts 스키마, Nest 단위·e2e, React 컴포넌트, 키보드·axe 접근성), 헬퍼 사용법, 좋은 테스트의 기준. 테스트를 새로 쓰거나 보강할 때, test-engineer가 작업할 때 사용한다.
---

# 테스트 작성

## 계층별 전략

| 대상 | 도구 | 위치 | 무엇을 |
| --- | --- | --- | --- |
| contracts 스키마 | Vitest | `packages/contracts/src/*.spec.ts` | 경계값(min/max), 잘못된 입력 거부, transform 결과 |
| Nest 서비스/컨트롤러 | Vitest + SWC + `@nestjs/testing` | `apps/api/src/**/*.spec.ts` | 분기·에러 코드·상태 전이·멱등성. Prisma/Redis/큐는 mock |
| api HTTP 경로 | Vitest + supertest, 실제 DB·Redis | `apps/api/test/*.e2e-spec.ts` | 검증 파이프(400), 응답이 contracts로 parse 되는지, 동시성 |
| React 컴포넌트 | Vitest + Testing Library + jsdom | `apps/web/src/**/*.test.tsx` | 렌더링 상태, 사용자 상호작용, 호출한 API, 키보드, axe |
| 화면 상태 시각 확인 | Storybook | `*.stories.tsx` | `write-stories` 스킬 참고 |

## 훅 테스트와 컴포넌트 테스트의 역할 (web)

로직은 `hooks/`·`utils/`에, UI는 `components/`에 둔다(`web-feature` 스킬). 테스트도 같은 경계로 나눈다.

| 무엇을 | 어디서 | 도구 |
| --- | --- | --- |
| 상태 전이·분기·에러·재시도·경계값·타이머·브라우저 API 대체 동작 | **훅 테스트** `hooks/useXxx.test.ts(x)` | `renderHook`, 필요하면 `QueryClientProvider` wrapper, `vi.useFakeTimers` |
| 순수 계산 | **utils 테스트** `utils/xxx.test.ts` | 일반 단위 테스트 |
| 상태별 렌더링, 이름·역할·`aria-*`, 키보드 조작, axe, 훅과의 연결(대표 흐름 1개) | **컴포넌트 테스트** `components/**/Xxx.test.tsx` | Testing Library |

- 같은 분기를 훅 테스트와 컴포넌트 테스트에서 두 번 검증하지 않는다. 컴포넌트 테스트에서 로직 분기를 발견하면 훅 테스트로 옮긴다.
- 옮길 때는 옮기기 전 단언 목록과 옮긴 뒤 위치를 대조해 커버리지가 줄지 않게 한다.
- 컴포넌트 테스트에서 훅을 mock하지 않는다(연결 확인이 목적). 대신 fetch·브라우저 API를 mock한다.

## 좋은 테스트의 기준

- 이름은 **동작을 문장으로**: `'정원이 가득 차면 409와 안내 문구'`. 구현 이름(`'calls updateMany'`)으로 짓지 않는다.
- 성공 1개당 실패 경로를 최소 1개 쓴다. 엣지 케이스는 `edge-cases` 스킬의 목록에서 고른다.
- 구현 세부가 아닌 **관찰 가능한 결과**를 검증한다: 반환값, HTTP 응답, 화면에 보이는 것, 호출된 API.
- 테스트끼리 상태를 공유하지 않는다 (`beforeEach`에서 mock 초기화, e2e는 자기 데이터 생성·정리).
- 시간 의존 로직은 `vi.useFakeTimers()`/`vi.setSystemTime()`으로 고정한다. 실제 `sleep` 금지.
- 스냅샷 테스트는 쓰지 않는다 (DS 클래스명이 해시라 의미 없이 깨진다).

## api

```ts
// 단위: 의존성을 vi.fn()으로 주입
const prisma = { booking: { findUnique: vi.fn(), updateMany: vi.fn() }, $transaction: vi.fn((fn) => fn(prisma)) };
const moduleRef = await Test.createTestingModule({
  providers: [BookingsService, { provide: PrismaService, useValue: prisma }],
}).compile();

await expect(service.cancel('b1')).rejects.toBeInstanceOf(ConflictException);
```

```ts
// e2e: 응답을 contracts 스키마로 검증하고, 동시성은 Promise.all로
const results = await Promise.all(
  Array.from({ length: 10 }, () => request(server).post('/bookings').send({ sessionId, headcount: 1 })),
);
expect(results.filter((r) => r.status === 201)).toHaveLength(capacity);
expect(results.filter((r) => r.status === 409)).toHaveLength(10 - capacity);
```

## web

헬퍼 (`apps/web/src/test/`):

- `mockFetch(handler)` / `json(body, status)` — 전역 fetch 대체, 정리 함수 반환
- `renderWithQuery(ui)` — 재시도 없는 새 QueryClient로 렌더링
- `expectNoA11yViolations(container)` — axe 검사 (색 대비 제외)

```tsx
let restore = () => {};
afterEach(() => restore());

it('예약하기를 누르면 POST /api/bookings를 보내고 결제 단계로 간다', async () => {
  const calls: Array<{ url: string; body?: unknown }> = [];
  restore = mockFetch((url, init) => {
    calls.push({ url, body: init?.body && JSON.parse(String(init.body)) });
    return json(booking, 201);
  });
  renderWithQuery(<BookButton sessionId="s1" />);

  await userEvent.click(screen.getByRole('button', { name: '예약하기' }));

  expect(calls).toContainEqual({ url: '/api/bookings', body: { sessionId: 's1', headcount: 1 } });
});
```

- 쿼리: `getByRole` > `getByLabelText` > `getByText`. `getByTestId`는 마지막 수단.
- 비동기 결과는 `findBy*`. `waitFor` 안에서 부수 효과를 일으키지 않는다.
- 폴링: `vi.useFakeTimers({ shouldAdvanceTime: true })` 후 `vi.advanceTimersByTimeAsync(5_000)`로 다음 요청을 확인하고, 최종 상태에서 **더 이상 요청하지 않는지**도 검증한다.
- 상호작용 컴포넌트마다: 키보드 조작 테스트 1개(`userEvent.tab()`, `keyboard('{Enter}')`/`' '`) + `expectNoA11yViolations` 1개.

## 실행

```bash
pnpm --filter @haru/web test          # 또는 test:watch
pnpm --filter @haru/api test
pnpm test:e2e                         # DB·Redis 필요
pnpm turbo run typecheck test --continue   # 전체 (병렬)
```
