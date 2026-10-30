---
name: verify
description: haru-class 변경 사항을 안전하게 검증한다. 타입 체크·테스트를 Turborepo로 병렬 실행하고, 개발 서버가 떠 있으면 build를 건너뛴다. 작업을 마치기 전, 커밋 전, "검증해줘", "테스트 돌려줘"에 사용한다.
---

# 검증

작업 중에 빠르게 돌리는 검증이다 (typecheck·test 중심). **커밋 직전**에는 lint·Storybook 테스트·빌드까지 포함한 `/precommit`을 쓴다.

## 1. 상태 확인 (병렬로 한 번에)

```bash
lsof -nP -iTCP:3000 -iTCP:4000 -sTCP:LISTEN    # 개발 서버 실행 여부
docker compose ps --format '{{.Service}} {{.State}}'
```

## 2. 기본 검증 — 항상

```bash
pnpm turbo run typecheck test --continue
```

- Turborepo가 패키지별 작업을 병렬로 돌린다. contracts는 `^build` 의존성으로 먼저 빌드된다.
- `--continue`로 하나가 실패해도 나머지 결과를 끝까지 본다.
- 출력이 길면 `| sed 's/\x1b\[[0-9;]*m//g' | grep -E "✓|×|FAIL|error|Tests |Tasks"`로 요약한다.

## 3. 조건부 검증

| 조건 | 명령 |
| --- | --- |
| DB·Redis가 running | `pnpm test:e2e` |
| `apps/web`의 컴포넌트/스토리를 바꿈 | `pnpm build-storybook` (dev 중에도 안전) |
| 개발 서버가 **꺼져 있음** | `pnpm build` |
| 개발 서버가 **켜져 있음** | `build`는 실행하지 않는다 (`nest build`가 dist를 지워 api가 죽는다). 대신 `pnpm smoke`로 주요 라우트의 HTTP 상태를 확인한다 (서버 컴포넌트 런타임 오류는 테스트·빌드가 못 잡는다) |
| Prisma 스키마를 바꿈 | `pnpm turbo run generate` 후 위 검증 (typecheck·test는 generate에 의존하므로 turbo로 돌리면 자동) |

## 4. 보고

명령별로 통과/실패와 테스트 수를 적는다. 실패는 에러 출력의 핵심 줄을 그대로 보여주고 원인을 설명한다.
건너뛴 검증이 있으면 왜 건너뛰었는지 적는다 (예: "dev 서버 실행 중이라 build 생략").
