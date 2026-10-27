---
name: pr-draft
description: 작업 브랜치의 변경 내용을 바탕으로 PR 초안(제목, 본문)을 .pr-drafts/<branch>.md 파일로 작성한다. 사용자가 직접 PR을 올릴 때 붙여넣는 용도. 기능 작업이 끝났을 때, "PR 초안 써줘", "PR 정리해줘", /feature 마지막 단계, 릴리스(develop → main)·hotfix PR에 사용한다.
---

# PR 초안 작성

PR은 사용자가 직접 올린다. 이 스킬은 **초안 파일만** 쓴다. `gh pr create`, `git push`는 실행하지 않는다.

## 1. 정보 모으기 (읽기 명령, 병렬로)

```bash
git branch --show-current
git log --oneline <base>..HEAD
git diff --stat <base>...HEAD
git status --short                  # 커밋 안 된 변경이 있으면 초안 맨 위에 경고
```

- base 결정: `feat/` `fix/` `chore/` `docs/` → `develop`, `hotfix/` → `main`, 현재 브랜치가 `develop`이면 릴리스 PR(`develop` → `main`).
- 브랜치가 `main`/`develop`인데 릴리스가 아니면, 작업 브랜치를 만드는 명령을 먼저 추천하고 멈춘다.
- 이 대화에서 이미 나온 정보를 우선 쓴다: 계획(plan-steps), `/precommit` 결과, 리뷰어 보고, 남은 이슈. 없으면 diff와 커밋에서 정리하고, 검증은 지금 `/precommit`을 돌려 결과를 넣는다.

## 2. 제목

```
<type>: <요약>
```

- 커밋 메시지와 같은 형식 (scope 없음). type은 브랜치 접두사에 맞춘다: `feat/` → `feat`, `fix/` → `fix`, `chore/` → `chore`, `docs/` → `docs`, `hotfix/` → `fix`.
- 릴리스 PR: `release: <YYYY-MM-DD> develop → main`.

## 3. 본문 템플릿

```markdown
## 개요
- 무엇을, 왜 (2~3줄)

## 변경 사항
### contracts
- ...
### api
- `METHOD /path` — 설명
### web
- 화면/컴포넌트 — 설명
### 기타 (설정·문서·테스트 인프라)
- ...

## 스크린샷
<!-- 화면 변경이 있으면 첨부. Storybook: <title>/<story> -->

## 검증
- [x] `pnpm precommit` — typecheck · lint · test(N) · test:storybook(N) · build:check
- [x] `pnpm test:e2e` — N개 통과
- [ ] 수동 확인: (사용자가 직접 확인할 시나리오)

## 리뷰 결과
- 반영함: ...
- 남은 이슈: ... (후속 작업 브랜치 제안)

## 배포·운영 메모
- 마이그레이션: 있음/없음 (이름)
- 환경변수: 추가/변경 사항
- 하위 호환: API 응답 변경 여부

## 커밋
- `abc1234` type: 요약
```

- 해당 없는 섹션은 지운다 (예: web 변경이 없으면 `### web` 삭제, 마이그레이션 없으면 "없음" 한 줄).
- 검증 결과는 **실제로 실행한 결과만** 적는다. 실행하지 않았으면 `[ ]`로 두고 이유를 적는다.
- 비밀값, 내부 URL, 토큰은 넣지 않는다.
- 릴리스 PR은 "변경 사항" 대신 포함된 PR 목록(`git log --merges --oneline main..develop`)과 배포 체크리스트를 쓴다.
- hotfix PR은 "develop에도 반영 필요" 체크박스를 넣는다.

## 4. 파일로 저장하고 안내

- 경로: `.pr-drafts/<branch를 /→- 로 바꾼 이름>.md` (예: `.pr-drafts/feat-session-availability.md`).
- 파일 맨 위에 `<!-- title: <제목> -->` 주석으로 제목을 두고 그 아래에 본문을 쓴다. 주석은 GitHub에서 보이지 않으므로 파일을 그대로 `--body-file`로 쓰거나 웹에 붙여넣어도 된다.
- `.pr-drafts/`는 `.gitignore`에 있다. 없으면 추가를 제안한다.
- 같은 파일이 있으면 덮어쓰기 전에 사용자에게 알린다.
- 마지막에 사용자가 실행할 명령을 추천한다:

```bash
git push -u origin <branch>
gh pr create --base <base> --head <branch> --title "<제목>" --body-file .pr-drafts/<file>.md
```