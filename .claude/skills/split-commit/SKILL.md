---
name: split-commit
description: 작업 트리의 변경 사항을 관심사별로 묶어 커밋 계획을 추천한다 (묶음, 순서, 커밋 메시지, 사용자가 실행할 명령). 직접 커밋하지 않는다. "커밋 나눠줘", "커밋 추천해줘", "관심사별로 커밋", "/split-commit"에 사용한다.
---

# 관심사별 커밋 추천

**이 스킬은 추천만 한다.** `git add`, `git commit`, `git reset`, `git stash`, `git apply --cached` 등 인덱스나 이력을 바꾸는 명령을 실행하지 않는다.
사용자가 추천을 보고 직접 커밋한다. (사용자가 이 대화에서 명시적으로 "커밋까지 해줘"라고 해도, 먼저 추천을 보여주고 다시 확인받는다.)

## 1. 현황 파악 (읽기 명령만, 병렬로 한 번에)

```bash
git status --porcelain=v1 -uall
git diff --stat
git diff --cached --stat
git log --oneline -10
git branch --show-current
```

- 이미 스테이징된 것이 있으면 사용자가 의도한 묶음일 수 있다. 첫 커밋 후보로 존중하고 그렇게 적는다.

### 브랜치 확인 (CLAUDE.md의 브랜치 전략)

| 현재 브랜치 | 추천 |
| --- | --- |
| `feat/` `fix/` `chore/` `docs/` `hotfix/` | 그대로 진행 |
| `develop` | ⚠️ develop에 직접 커밋하지 않는다. 변경 성격에 맞는 브랜치를 먼저 만들도록 추천: `git switch -c feat/<slug>` (커밋 안 된 변경은 그대로 따라간다) |
| `main` | ⚠️ main에 직접 커밋하지 않는다. 긴급 수정이면 `git switch -c hotfix/<slug>`, 아니면 `git switch develop && git switch -c feat/<slug>`. 예외: 저장소 첫 뼈대 커밋 |

브랜치 이름의 접두사와 커밋 type이 어긋나면(예: `docs/`인데 feat 커밋) 알려준다. 막지는 않는다.

## 2. 커밋하면 안 되는 것 표시

- `.env`, `.env.local`, `*.pem`, 토큰이 들어간 `.npmrc` 등 비밀값 → "커밋 제외"로 표시. `.gitignore`에 없으면 추가를 추천한다.
- 빌드 산출물(`dist`, `.next`, `storybook-static`, `src/generated`, `.turbo`, `*.tsbuildinfo`) → 제외.
- 새 파일에서 `ghp_`, `gho_`, `npm_`, `sk-`, `-----BEGIN`, `password=` 패턴을 검색해서 나오면 **맨 위에 경고**한다 (값은 옮겨 적지 않고 위치만).

## 3. 관심사 묶기

앞의 것이 뒤의 것의 전제가 되도록 순서를 정한다. 각 커밋이 단독으로도 타입 체크가 통과하는 것을 목표로 한다.

| 순서 | 묶음 | 예시 경로 | type |
| --- | --- | --- | --- |
| 1 | 저장소·빌드 설정 | 루트 `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.npmrc`, `.gitignore`, `docker-compose.yml`, `packages/config-*` | `build` / `chore` |
| 2 | 공유 계약 | `packages/contracts/**` | `feat` |
| 3 | DB 스키마·마이그레이션 | `apps/api/prisma/**` | `feat` |
| 4 | 백엔드 | `apps/api/src/**` (+ 같은 기능의 spec) | `feat` / `fix` / `refactor` |
| 5 | 프론트엔드 | `apps/web/src/**` (+ 같은 기능의 test, stories) | `feat` / `fix` / `refactor` |
| 6 | 테스트 인프라·스토리북 설정 | `vitest.config.*`, `.storybook/**`, `src/test/**` | `test` / `build` |
| 7 | 개발 도구 | `.claude/**`, `CLAUDE.md`, `.vscode/**` | `chore` |
| 8 | 문서 | `README.md`, `docs/**` | `docs` |

- 기능 코드와 그 테스트·스토리는 같은 커밋. 테스트 인프라 자체(설정, 헬퍼)는 따로.
- `pnpm-lock.yaml`은 의존성을 추가한 package.json과 같은 커밋.
- 한 파일에 서로 다른 관심사가 섞여 있으면 "hunk 단위로 나눠야 함"으로 표시하고, 어느 부분이 어느 커밋에 속하는지 줄 범위로 적는다.
- 묶음이 1개뿐이면 커밋 하나를 추천한다. 억지로 쪼개지 않는다.

## 4. 커밋 메시지 형식

```
<type>: <무엇을 했는지, 한국어, 간결하게>

- <변경 내용 1>
- <변경 내용 2>
```

- 첫 줄: `type: 요약`. scope 괄호는 쓰지 않는다. 마침표 없음.
- 본문: 불릿 2~4개, 각 한 줄. 무엇을 바꿨는지/왜 바꿨는지만 짧게.
- 제목과 본문 사이 빈 줄 하나는 git 관례라 둔다 (`git log --oneline`이 제목만 보여주게). `-m "제목" -m "불릿들"`로 쓰면 자동으로 들어간다.
- type: `feat` `fix` `refactor` `test` `docs` `build` `chore` `perf` `style` `ci`

예:

```
feat: 회차별 남은 좌석 조회 API 추가

- GET /sessions/availability 일괄 조회
- Redis 3초 캐시, 예약·취소 시 무효화
```

## 5. 출력 형식

```markdown
## 커밋 추천 (N개)

⚠️ 경고: (비밀값·산출물 등 있으면)

### 1. build: 모노레포 기본 설정
- pnpm workspace, turbo 파이프라인 구성
- 로컬 PostgreSQL·Redis docker-compose 추가

포함: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, ...
제외: `apps/api/.env` (비밀값)

### 2. ...

## 실행 명령 (직접 실행)
```bash
git add -- package.json pnpm-workspace.yaml turbo.json
git commit -m "build: 모노레포 기본 설정" -m "- pnpm workspace, turbo 파이프라인 구성
- 로컬 PostgreSQL·Redis docker-compose 추가"
...
```
```

- 실행 명령은 사용자가 그대로 복사해서 쓸 수 있게 경로를 모두 적는다.
- hunk 단위로 나눠야 하는 파일은 `git add -p <file>`로 안내하고 어느 hunk를 고를지 적는다.
- 커밋마다 확인용으로 `pnpm --filter <pkg> typecheck`를 함께 추천할 수 있다.
- 브랜치 생성이 필요하면 실행 명령 맨 앞에 넣는다. push와 PR은 `pr-draft` 스킬에서 안내한다.
