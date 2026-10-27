# 하루클래스 (haru-class)

원데이 클래스 예약 서비스. pnpm 11 + Turborepo 모노레포. 구조와 실행 방법은 README.md를 본다.

## 패키지와 책임 범위

| 경로 | 스택 | 담당 |
| --- | --- | --- |
| `packages/contracts` | zod 4 스키마/타입 (ESM+CJS, tsup) | 메인 세션 (기능 시작 시 먼저 정의) |
| `apps/api` | NestJS 11, Prisma 7 (PostgreSQL), BullMQ (Redis), nestjs-zod | `api-engineer` 에이전트 |
| `apps/web` | Next.js 16 App Router, TanStack Query 5, `@aninganing/react` DS, Storybook 10 | `web-engineer` 에이전트 |

기능 개발은 `/feature` 스킬을 따른다: `plan-steps`로 단계 나누기 → contracts 정의 → api·web 병렬 구현 → `/verify` → `test-engineer` 보강 → 리뷰어 4종 병렬 → 수정 → `split-commit`으로 커밋 추천.

### 진행 방식 (항상)

- **제안 → 사용자 수락 → 실행.** 메인 세션과 모든 에이전트는 작업 방향(목표, 접근, 바꿀 파일, 확인할 것)을 먼저 제안하고, 사용자가 수락한 뒤에만 파일을 바꾸거나 상태를 바꾸는 명령을 실행한다. 수락은 그 단계에만 적용된다.
- 에이전트는 `[승인]` 없이 띄우면 제안만 돌려준다. 수락 후 SendMessage로 **같은 에이전트**에 `[승인] <수정 사항>`을 보내 실행시킨다.
- 읽기·검증(파일 읽기, typecheck, test)은 수락 없이 해도 된다.
- **커밋은 하지 않는다.** `git add`/`git commit` 등 이력·인덱스를 바꾸는 명령을 실행하지 않고, `split-commit` 스킬로 커밋 묶음·메시지·명령을 추천만 한다.
- 커밋 메시지 형식: 첫 줄 `type: 요약`(scope 없음), 빈 줄, 본문은 짧은 불릿 2~4개.

### 브랜치 전략

```
main ────────●───────────────●──────── (릴리스만)
              \             / ↑ release PR (develop → main)
develop ───────●──●────●───●─────────── (통합)
                \  \  / \ /
                 feat/... fix/... chore/... docs/...   (develop에서 분기 → develop으로 PR)
hotfix/... : main에서 분기 → main으로 PR → develop에도 반영
```

- 작업 브랜치: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>` — **develop에서 분기**, develop으로 PR. slug는 kebab-case 영어 (예: `feat/session-availability`).
- 긴급 수정: `hotfix/<slug>` — main에서 분기, main으로 PR 후 develop에도 병합.
- 릴리스: develop → main PR.
- 병합 방식: **merge commit** (squash·rebase 하지 않음 → 관심사별 커밋이 이력에 남는다).
- **브랜치 생성·전환, 커밋, push, PR 생성은 모두 사용자가 직접 한다.** Claude는 명령만 추천한다 (`git switch`, `git branch`, `git push`, `gh pr create`를 실행하지 않는다).
- main·develop에서 작업을 시작하려 하면 먼저 알맞은 작업 브랜치 생성 명령을 추천한다.
- 작업이 끝나면 `pr-draft` 스킬로 PR 초안을 `.pr-drafts/<branch>.md`에 쓴다 (git에 포함되지 않음).

### 에이전트

| 에이전트 | 권한 | 역할 |
| --- | --- | --- |
| `api-engineer` | 쓰기 (`apps/api`) | 백엔드 구현 + 기본 테스트 |
| `web-engineer` | 쓰기 (`apps/web`) | 프론트 구현 + 기본 테스트·스토리 |
| `test-engineer` | 쓰기 (테스트·스토리 파일만) | 테스트·스토리 전담, 공백 보강, 버그 발견 시 보고 |
| `reviewer` | 읽기 | 계약 일치, 구조, 컨벤션 |
| `security-reviewer` | 읽기 | 인가(IDOR), 프록시 노출, 결제·웹훅, 비밀값 |
| `edge-case-analyst` | 읽기 | 동시성·시간·경계값·상태 전이 시나리오와 테스트 케이스 제안 |
| `a11y-reviewer` | 읽기 | 키보드·포커스·스크린 리더·대비 |

쓰기 에이전트는 서로 다른 파일 영역만 맡으므로 병렬 실행할 수 있고, 읽기 에이전트는 언제든 병렬로 띄울 수 있다.

### 스킬

`feature`(전체 흐름) · `plan-steps`(단계 계획) · `verify`(검증) · `split-commit`(관심사별 커밋) · `nest-module` · `web-feature` · `write-tests` · `write-stories` · `security-check` · `edge-cases` · `a11y-check`

## 반드시 지킬 것

- **contracts가 단일 진실 공급원**이다. API 요청/응답 형태는 `packages/contracts`의 zod 스키마로 정의하고 api·web 모두 그 타입을 쓴다. 바꾸면 `pnpm --filter @haru/contracts build`.
- **개발 서버가 떠 있을 때 `build`를 돌리지 않는다.** `nest build`가 `dist`를 지워 `pnpm dev`의 api가 죽는다. 검증은 `/verify` 스킬(typecheck·test 위주)을 쓴다.
- 의존성 추가는 메인 세션만 한다 (병렬 에이전트가 동시에 `pnpm add`하면 lockfile이 충돌한다). pnpm 11의 minimumReleaseAge 때문에 하루 이내 릴리스는 설치가 막힐 수 있다 → 이전 버전으로 고정한다.
- Node는 22.14(현재 로컬). 엔진 요구가 더 높은 패키지(jsdom 30 등)는 쓰지 않는다.
- TypeScript는 5.9 (Nest 데코레이터 메타데이터). `baseUrl` 같은 TS 6+ deprecated 옵션을 쓰지 않는다.
- 시간은 DB에 `timestamptz`(UTC)로 저장하고 화면에서 Asia/Seoul로 표시한다.
- 비밀값(토큰, .env 내용)을 코드·커밋·출력에 넣지 않는다. DS 패키지 토큰은 `~/.npmrc`에만 있다.

## 웹 규칙 요약 (자세한 건 `.claude/skills/web-feature`, `a11y-check`)

- Next 16은 학습 데이터와 API가 다를 수 있다. 새 API를 쓰기 전 `apps/web/node_modules/next/dist/docs/`의 해당 문서를 확인한다.
- 브라우저는 Nest를 직접 부르지 않는다. `@/lib/api/client`의 `api`만 쓴다 (서버: Nest 직접, 브라우저: `/api` 프록시).
- 쿼리 키는 `src/lib/query/keys.ts`에서만 만든다. 쿼리는 `queryOptions`로 `src/features/<domain>/queries.ts`에 둔다.
- 색·간격·글꼴은 DS 토큰 CSS 변수(`--color-*`, `--space-*`, `--font-size-*`, `--radius-*`)만 쓴다. DS에 없는 컴포넌트(Calendar, Dialog, Select, Toast 등)는 `src/components/ui`에 만든다.
- DS 컴포넌트에 함수 props를 넘기는 코드는 `'use client'` 컴포넌트 안에 둔다.
- 상호작용 컴포넌트는 테스트(키보드 + `expectNoA11yViolations`)와 상태별 스토리를 함께 만든다.

## API 규칙 요약 (자세한 건 `.claude/skills/nest-module`)

- 도메인별 모듈 (`src/modules/<domain>`): controller → service → PrismaService. 입력은 `createZodDto(contracts 스키마)`.
- 동시성이 걸린 쓰기(좌석 등)는 조건부 UPDATE나 트랜잭션으로 원자적으로 처리한다.
- 비동기 작업은 BullMQ 큐. jobId로 멱등성을 보장한다 (`:` 문자는 쓰지 않는다).

## 명령어

```bash
pnpm dev                # web :3000, api :4000
pnpm db:up              # PostgreSQL, Redis (Docker)
pnpm typecheck          # 전체 타입 체크 (병렬)
pnpm test               # 전체 단위 테스트 (병렬)
pnpm test:e2e           # api e2e (db:up 필요)
pnpm storybook          # web Storybook :6006
pnpm build-storybook    # Storybook 정적 빌드 (dev 중에도 안전)
pnpm --filter @haru/api prisma:migrate   # 마이그레이션
```
