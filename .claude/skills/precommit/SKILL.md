---
name: precommit
description: 커밋 직전에 haru-class 전체 품질 검사를 병렬로 실행한다 — typecheck, lint, 단위 테스트, Storybook 테스트(실제 Chromium, play·a11y), 빌드(dev 서버와 충돌하지 않는 별도 폴더), 조건부 e2e. 결과를 표로 보여주고 커밋해도 되는지 판정한다. "커밋 전에 확인", "전부 돌려봐", "precommit", split-commit·pr-draft 전에 사용한다.
---

# 커밋 전 전체 검사

검사만 한다. 실패를 고치는 것은 원인과 수정 방향을 **제안**하고 사용자가 수락한 뒤에 한다. 커밋은 하지 않는다.

## 1. 상태 확인 (병렬로 한 번에)

```bash
git branch --show-current
git status --short
lsof -nP -iTCP:3000 -iTCP:4000 -sTCP:LISTEN
docker compose ps --format '{{.Service}} {{.State}}'
ls ~/Library/Caches/ms-playwright | grep -E '^chromium' | head -1
```

- 브랜치가 `main`/`develop`이면 결과 보고 맨 위에 작업 브랜치 생성 명령을 추천한다 (CLAUDE.md 브랜치 전략).
- 커밋할 변경이 없으면 그렇게 알리고, 그래도 검사는 돌린다.
- Chromium이 없으면 Storybook 테스트가 실패한다. 설치 명령(`pnpm --filter @haru/web exec playwright install chromium`, 약 150MB 다운로드)을 안내하고 **사용자가 수락하면** 실행한다.

## 2. 전체 검사 (병렬)

```bash
pnpm precommit
# = turbo run typecheck lint test test:storybook build:check --continue
```

| 작업 | 패키지 | 내용 |
| --- | --- | --- |
| `typecheck` | 전체 | `tsc --noEmit` (web은 `next typegen` 포함) |
| `lint` | 전체 | 루트 `eslint.config.mjs` — TS, Next, React Hooks, jsx-a11y, Storybook 규칙 |
| `test` | 전체 | Vitest 단위 테스트 (api: SWC, web: jsdom + axe) |
| `test:storybook` | web | 모든 스토리를 Chromium에서 렌더링, `play` 상호작용, a11y(색 대비 포함) |
| `build:check` | 전체 | api → `dist-check/`, web → `.next-check/`, contracts → `dist-check/`. **dev 서버가 떠 있어도 안전** |

- turbo가 패키지·작업을 병렬로 돌리고, `--continue`로 실패가 있어도 끝까지 실행한다.
- turbo 캐시가 있으면 입력이 바뀌지 않은 작업은 캐시 결과를 쓴다 (정상). 캐시를 믿지 못할 상황이면 `--force`를 붙인다.
- 실제 배포용 `pnpm build`는 dev 서버가 **꺼져 있을 때만** 추가로 돌린다 (`nest build`가 `dist`를 지운다).

## 3. 조건부 검사

DB·Redis가 running이면 이어서 실행한다:

```bash
pnpm test:e2e
```

꺼져 있으면 건너뛰고 "e2e 생략 (pnpm db:up 후 재실행 가능)"으로 보고한다.

## 4. 결과 정리

출력이 길면 `| sed 's/\x1b\[[0-9;]*m//g' | grep -E "Tests |Test Files|error|✖|Tasks|Failed"`로 요약하고, 실패한 작업만 전체 출력을 본다.

```markdown
## precommit 결과 — ✅ 커밋 가능 / ❌ 수정 필요

| 단계 | contracts | api | web |
| --- | --- | --- | --- |
| typecheck | ✅ | ✅ | ✅ |
| lint | ✅ | ✅ | ❌ 2 errors |
| test | ✅ 3 | ✅ 2 | ✅ 7 |
| test:storybook | - | - | ✅ 6 |
| build:check | ✅ | ✅ | ✅ |
| e2e | - | ✅ 1 / ⏭ 생략 | - |

### 실패
- `apps/web/src/x.tsx:12` jsx-a11y/click-events-have-key-events — 원인 한 줄
  수정 제안: ...

### 참고
- 경고(빌드 경고, 큰 번들 등)는 실패가 아니지만 눈여겨볼 것만 적는다
```

- 판정: 모든 필수 단계(typecheck, lint, test, test:storybook, build:check)가 ✅이면 **커밋 가능**. 하나라도 ❌면 **수정 필요**. 생략된 단계가 있으면 이유와 함께 적는다.
- lint 오류 중 자동 수정 가능한 것은 `pnpm --filter <pkg> exec eslint --fix <path>`를 **제안**만 한다 (수락 후 실행).
- 통과했으면 다음으로 `split-commit`(커밋 추천)을 안내한다.
