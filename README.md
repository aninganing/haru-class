# 하루클래스 (haru-class)

원데이 클래스 예약 서비스. pnpm workspaces + Turborepo 모노레포.

## 구조

```
haru-class/
├─ apps/
│  ├─ web/          # Next.js 16 (App Router) + TanStack Query + @aninganing/react
│  └─ api/          # NestJS 11 + Prisma 7 (PostgreSQL) + BullMQ (Redis)
├─ packages/
│  ├─ contracts/    # web·api 공유 zod 스키마/타입 (ESM + CJS 빌드)
│  └─ config-ts/    # 공유 tsconfig
└─ docker-compose.yml   # 로컬 PostgreSQL, Redis
```

### 요청 흐름

```
브라우저 ──useQuery──> /api/* (Next Route Handler 프록시) ──Bearer──> Nest
Next 서버(RSC, prefetch, Server Action) ─────────────────────Bearer──> Nest
```

- 토큰은 Next 도메인의 httpOnly 쿠키(`access_token`)에만 둔다. 브라우저는 Nest를 직접 부르지 않는다 (CORS 없음).
- `apps/web/src/lib/api/client.ts`는 서버/브라우저 겸용이다. 서버에서는 Nest를 직접, 브라우저에서는 `/api` 프록시를 호출한다.
- 데이터 역할 분담
  - 정적이고 SEO가 필요한 데이터: 서버 컴포넌트에서 조회
  - 자주 바뀌는 데이터(좌석, 예약 상태): 서버에서 prefetch → `HydrationBoundary` → `useQuery` 폴링
  - 쿼리 키는 `lib/query/keys.ts`에서만 만든다

## 시작하기

### 1. 디자인 시스템 패키지 인증 (최초 1회)

`@aninganing/react`는 GitHub Packages(비공개)에 있어서 설치할 때도 `read:packages` 권한 토큰이 필요하다.
pnpm 11은 프로젝트 `.npmrc`에 있는 인증 값을 읽지 않으므로, 토큰은 **사용자 홈의 `~/.npmrc`**에 둔다.

```bash
gh auth refresh -h github.com -s read:packages
echo "//npm.pkg.github.com/:_authToken=$(gh auth token)" >> ~/.npmrc
```

### 2. 설치와 실행

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm db:up        # PostgreSQL, Redis (Docker)
pnpm --filter @haru/web exec playwright install chromium   # Storybook 테스트용 (최초 1회)
pnpm dev          # web: http://localhost:3000, api: http://localhost:4000
```

http://localhost:3000 에서 API·DB·Redis 상태 카드가 10초마다 갱신되면 전체 경로가 연결된 것이다.

## 명령어

| 명령 | 설명 |
| --- | --- |
| `pnpm dev` | 전체 개발 서버 (contracts 빌드 후 web/api 실행) |
| `pnpm build` | 전체 빌드 |
| `pnpm typecheck` | 전체 타입 체크 |
| `pnpm test` | 전체 단위 테스트 (api: Vitest+SWC, web: Vitest+Testing Library, contracts) |
| `pnpm test:e2e` | api e2e (실제 DB·Redis 필요, `pnpm db:up`) |
| `pnpm lint` | ESLint (TS, Next, React Hooks, jsx-a11y, Storybook) |
| `pnpm test:storybook` | 모든 스토리를 Chromium에서 실행 (play 상호작용, a11y) |
| `pnpm build:check` | 별도 폴더(`dist-check`, `.next-check`)로 빌드 — dev 서버 실행 중에도 안전 |
| `pnpm smoke` | 실행 중인 dev 서버의 주요 라우트 HTTP 상태 확인 |
| `pnpm format` / `pnpm format:check` | Prettier (+ Tailwind 클래스 정렬) |
| `pnpm precommit` | 커밋 전 전체 검사 (typecheck · lint · test · test:storybook · build:check, 병렬) |
| `pnpm storybook` | web 컴포넌트 Storybook (http://localhost:6006) |
| `pnpm build-storybook` | Storybook 정적 빌드 |
| `pnpm db:up` / `pnpm db:down` | 로컬 DB·Redis 켜기/끄기 |
| `pnpm db:migrate` | Prisma 마이그레이션 (`prisma migrate dev`) |

## Claude Code 세팅

규칙은 `CLAUDE.md`, 에이전트는 `.claude/agents/`, 스킬은 `.claude/skills/`에 있다.
모든 에이전트는 먼저 작업 방향을 제안하고, 사용자가 수락한 뒤에 실행한다. 커밋은 사용자가 직접 한다.

| 에이전트 | 역할 |
| --- | --- |
| `api-engineer` / `web-engineer` | api·web 구현 (병렬 실행) |
| `test-engineer` | 테스트·스토리 전담 |
| `reviewer` / `security-reviewer` / `edge-case-analyst` / `a11y-reviewer` | 읽기 전용 리뷰 (병렬 실행) |

| 스킬 | 용도 |
| --- | --- |
| `/feature` | 계획 → contracts → api·web 병렬 → 검증 → 테스트 보강 → 리뷰 4종 병렬 → 수정 → 커밋 추천 (단계마다 제안 후 수락받고 실행) |
| `/plan-steps` | 목표를 커밋 크기 단계로 나누고 의존·병렬 그룹·완료 조건 정리 |
| `/verify` | 작업 중 빠른 검증 (typecheck·test) |
| `/precommit` | 커밋 전 전체 검사 + 결과 표와 커밋 가능 판정 |
| `/split-commit` | 변경 사항을 관심사별로 묶어 커밋 메시지·명령을 **추천** (직접 커밋하지 않음) |
| `/pr-draft` | 작업 브랜치의 PR 초안을 `.pr-drafts/<branch>.md`로 작성 (PR은 직접 올림) |
| `write-tests`, `write-stories` | 테스트·스토리 작성 기준 |
| `security-check`, `edge-cases`, `a11y-check` | 보안·엣지 케이스·접근성 점검 기준 |
| `nest-module`, `web-feature` | api·web 코드 작성 규칙 |

## 브랜치 전략

- `main`: 릴리스. `develop` → `main` PR로만 반영
- `develop`: 통합 브랜치
- 작업: `feat/` `fix/` `chore/` `docs/` + kebab-case slug, **develop에서 분기 → develop으로 PR**
- 긴급 수정: `hotfix/<slug>`, main에서 분기 → main으로 PR → develop에도 반영
- 병합은 merge commit. 브랜치 생성·커밋·push·PR은 사람이 직접 한다 (Claude는 명령과 PR 초안만 제안)
- 커밋 메시지: `type: 요약` + 빈 줄 + 짧은 불릿

## CI와 브랜치 보호

- GitHub Actions `ci`: `verify`(typecheck·lint·test·Storybook 테스트·build:check), `e2e`(DB·Redis 위에서 e2e + 빌드 후 스모크), `branch-policy`(main으로는 develop·hotfix/*만).
- main·develop은 ruleset으로 보호한다: PR 필수, 필수 검사 통과, merge commit만, force push·삭제 금지.
- 디자인 시스템 패키지(`@aninganing/*`) 각각의 **Manage Actions access**에 이 저장소를 Read로 추가해야 CI가 설치할 수 있다.

## 배포 메모

- **web (Vercel)**: Root Directory는 `apps/web`. 환경변수 `API_URL`과,
  `NPM_RC`에 `//npm.pkg.github.com/:_authToken=<read:packages 토큰>`을 넣는다.
- **api**: Railway / Fly.io / ECS 등. `DATABASE_URL`, `REDIS_URL`, `PORT`.
- **CI (GitHub Actions)**: `actions/setup-node`에 `registry-url: https://npm.pkg.github.com`, `scope: '@aninganing'`,
  `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`. DS 패키지 설정 → *Manage Actions access*에 이 저장소를 추가해야 한다.

## 로드맵

1. [x] 아키텍처 뼈대 (모노레포, 인프라 연결, DS 연동, Query/프록시)
2. [ ] 도메인 모델 (User, Class, ClassSession, Booking, Payment) + 클래스 조회 API/화면
3. [ ] 인증 (카카오 OAuth, JWT 쿠키)
4. [ ] 예약: 좌석 홀드, 정원 동시성 처리, 남은 좌석 폴링
5. [ ] 결제: PG 연동, 확정 대기 폴링
6. [ ] 호스트 관리 화면, 알림, 리뷰
