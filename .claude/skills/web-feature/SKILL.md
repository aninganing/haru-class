---
name: web-feature
description: haru-class apps/web(Next.js 16 + TanStack Query + @aninganing/react DS)에 페이지·컴포넌트·쿼리·폴링을 작성하는 규칙과 템플릿. web 코드를 새로 쓰거나 고칠 때 사용한다. 테스트·스토리·접근성은 write-tests, write-stories, a11y-check 스킬을 함께 본다.
---

# 웹 기능 작성 규칙

## 파일 구조

```
apps/web/src/
├─ app/<route>/page.tsx            # 서버 컴포넌트: prefetch + HydrationBoundary
├─ features/<domain>/
│  ├─ components/[<area>/]         # UI만: props를 받아 그리고 훅을 호출한다 (+ 옆에 .test.tsx, .stories.tsx)
│  ├─ hooks/                       # 이 기능의 상태·부수효과 로직 (useXxx) + 옆에 .test.ts(x)
│  ├─ api/                         # queryOptions·useMutation (queries.ts), 서버 로더
│  ├─ utils/                       # 순수 함수 (포맷, 계산, href 만들기) + .test.ts
│  ├─ constants/                   # 문구·숫자 상수
│  ├─ styles/                      # 공용 Tailwind 클래스 (cn·cva로 감싼다)
│  └─ fixtures/                    # 테스트·스토리용 데이터
├─ hooks/                          # 기능과 무관한 범용 훅 (useAutoLoad, useHorizontalScroller …)
├─ components/layout/ · ui/        # 앱 공용 레이아웃 / DS에 없는 범용 UI
├─ lib/                            # api client, query client·keys, cn, theme
└─ test/                           # 테스트 헬퍼
```

- **UI와 로직을 나눈다**: 상태(`useState`)·부수효과(`useEffect`)·쿼리·브라우저 API 호출이 컴포넌트에 몇 줄 이상 생기면 `hooks/`의 `useXxx`로 옮기고, 컴포넌트는 훅이 돌려준 값으로 그리기만 한다. 계산은 `utils/`의 순수 함수로.
- **barrel(`index.ts`) 금지**: 서버 파일이 barrel을 거쳐 `'use client'` 모듈의 함수를 불러오면 런타임 500이 난다. 파일을 직접 import한다.
- 테스트·스토리는 대상 파일 옆에 둔다.

## Next 16

- `params`, `searchParams`, `cookies()`, `headers()`는 모두 **Promise**다 (`await`).
- 확실하지 않은 API는 `apps/web/node_modules/next/dist/docs/01-app/`에서 먼저 확인한다.
- 서버 컴포넌트가 기본이다. 상호작용·쿼리 훅·DS 컴포넌트에 함수 props를 넘기는 부분만 `'use client'`로 분리한다.

## 데이터 패턴

| 데이터 | 방식 |
| --- | --- |
| 정적·SEO (클래스 소개, 가격) | 서버 컴포넌트에서 `await api.get(...)` 후 바로 렌더링 |
| 자주 바뀜 (좌석, 예약 상태) | 서버에서 `prefetchQuery` → `HydrationBoundary` → 클라이언트 `useQuery` (+ 폴링) |
| 폼 제출 (등록, 리뷰) | Server Action에서 `api.post` 후 `revalidatePath/Tag` |
| Query 데이터를 바꾸는 작업 (예약, 취소) | `useMutation` + `onSuccess`에서 `invalidateQueries({ queryKey: keys.x.y(id) })` |

```ts
// features/session/queries.ts
export const availabilityQuery = (sessionId: string) =>
  queryOptions({
    queryKey: keys.session.availability(sessionId),
    queryFn: () => api.get<Availability>(`/sessions/${sessionId}/availability`),
    // 폴링은 반드시 종료 조건을 둔다
    refetchInterval: (q) => (q.state.data?.status === 'OPEN' ? 5_000 : false),
  });
```

```tsx
// app/classes/[classId]/page.tsx
export default async function Page({ params }: PageProps<'/classes/[classId]'>) {
  const { classId } = await params;
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(availabilityQuery(classId));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SessionPicker classId={classId} />
    </HydrationBoundary>
  );
}
```

- 폴링 종료 조건: 최종 상태 도달, 시간 초과(`useRef(Date.now())`로 시작 시각 기록), 백그라운드 탭(기본으로 멈춤).
- 에러 메시지는 `ApiError.message`(Nest 메시지)를 그대로 보여준다.

## 디자인 시스템 (`@aninganing/react`)

- 사용 가능: `Badge`(tone: neutral/accent/success/danger), `Button`(variant: primary/secondary/danger, size, isLoading), `Card`(+ `.Media` `.Body` `.Title`), `Checkbox`, `CheckboxGroup`, `Chip`, `Input`, `Radio`, `RadioGroup`, `Skeleton`, `Switch`(label 필수, onCheckedChange), `Tabs`, `Textarea`, `Tooltip`.
- props가 헷갈리면 `node_modules/@aninganing/react/dist/index.d.ts`를 확인한다. Storybook: https://aning-design-system.vercel.app/
- 스타일은 Tailwind 클래스로 쓰고(CLAUDE.md 웹 규칙의 테마 이름만), 아래 DS 토큰은 `@theme`를 거쳐 클래스가 된다. 원본 토큰: `var(--color-bg-default|subtle|muted)`, `--color-text-default|subtle|accent|danger`, `--color-border-default`, `--space-1..16`, `--font-size-50..600`, `--font-weight-*`, `--radius-sm|md|lg|full`. 하드코딩한 색·px 금지.
- 레이아웃에 주의: `Switch`처럼 부모 폭을 채우는 컴포넌트, flex column 안에서 늘어나는 `Badge`는 래퍼로 감싼다.
- 로딩 상태는 `Skeleton`, 비어 있음/에러는 문구 + `Badge tone="danger"`.

## 테스트·스토리·접근성

컴포넌트를 만들면 같은 폴더에 테스트와 스토리를 함께 둔다. 자세한 작성법은 전용 스킬을 따른다.

- `write-tests` — `mockFetch`/`renderWithQuery`/`expectNoA11yViolations` 헬퍼, 폴링 테스트, 키보드 테스트
- `write-stories` — 상태별 스토리, `beforeEach: () => mockFetch(...)`, `play` 상호작용
- `a11y-check` — 키보드·포커스·폴링 갱신 안내·폼 오류 규칙

최소 기준: 상호작용 컴포넌트마다 성공·빈 상태·에러 테스트, 키보드 조작 테스트 1개, axe 검사 1개, 상태별 스토리.
예시: `src/components/HealthStatus.{test,stories}.tsx`, `src/components/ThemeToggle.{test,stories}.tsx`.
