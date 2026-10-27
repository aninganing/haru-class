---
name: a11y-check
description: haru-class apps/web의 접근성·키보드 조작 점검과 대응 가이드 (WCAG 2.2 AA 기준). 시맨틱 마크업, 이름·역할·상태, 키보드 순서·포커스 관리, 폼 오류, 실시간 갱신(폴링) 안내, 색 대비, DS 컴포넌트 사용 시 주의점. 화면 작업 마감, 접근성 검토 요청, a11y-reviewer가 작업할 때 사용한다.
---

# 접근성·키보드 점검

## 자동 검사 (먼저)

- 단위 테스트: `expectNoA11yViolations(container)` (`apps/web/src/test/a11y.ts`, axe-core, 색 대비 제외)
- Storybook: Accessibility 패널 (색 대비 포함). light/dark 둘 다 확인
- 자동 검사는 문제의 일부만 잡는다. 아래 수동 항목을 반드시 본다.

## 체크리스트

### 구조
- [ ] 페이지마다 `<h1>` 하나, 제목 레벨을 건너뛰지 않음 (`Card.Title`의 `as`로 레벨 조정)
- [ ] 랜드마크: `header`, `main`, `nav`, `footer`. 반복 영역 앞에 "본문으로 건너뛰기" 링크
- [ ] 목록은 `ul/li`, 표 형태 데이터는 `table`
- [ ] `<html lang="ko">`, 페이지 `title`이 페이지마다 다름 (`metadata.title`)

### 이름·역할·상태
- [ ] 모든 버튼·링크·입력에 이해 가능한 이름 (아이콘 버튼은 `aria-label`)
- [ ] 링크는 이동, 버튼은 동작. `div onClick` 금지
- [ ] 선택·토글 상태는 `aria-pressed`/`aria-checked`/`aria-selected`/`aria-current`로 (DS `Chip`, `Switch`, `Tabs`는 이미 처리)
- [ ] 비활성 버튼은 이유를 텍스트로 함께 보여줌 ("마감", "로그인 필요")
- [ ] 장식 이미지는 `alt=""`, 의미 있는 이미지는 내용을 설명하는 `alt`

### 키보드
- [ ] 마우스 없이 모든 기능 사용 가능: Tab/Shift+Tab 이동, Enter/Space 실행, 화살표(라디오·탭 그룹), Esc(닫기)
- [ ] Tab 순서가 화면 순서와 같음. 양수 `tabIndex` 금지
- [ ] 포커스 표시가 항상 보임 (`outline: none` 금지, `:focus-visible`에 `--color-border-focus`)
- [ ] 회차 선택 같은 단일 선택 그룹은 `RadioGroup`(화살표 이동)으로
- [ ] 키보드 함정 없음 (모달 밖으로 Tab이 새지 않되, Esc로 나갈 수 있음)

### 포커스 관리
- [ ] Dialog: 열리면 첫 요소(또는 제목)로 포커스, 안에서 순환, 닫히면 열었던 버튼으로 복귀 (`components/ui`에 만들 때 Radix Dialog 사용 권장)
- [ ] 단계 이동(회차 선택 → 결제), 라우트 변경 후 새 영역의 제목으로 포커스
- [ ] 항목 삭제·취소 후 포커스가 사라지지 않고 다음 요소로 이동

### 폼
- [ ] 입력마다 보이는 `label` (placeholder만으로 대체 금지). DS `Input`/`Textarea`의 label prop 사용
- [ ] 오류: 필드 옆 문구 + `aria-invalid` + `aria-describedby`. 제출 시 첫 오류 필드로 포커스
- [ ] 필수 표시는 텍스트로도 ("필수")

### 동적 갱신 (폴링·비동기)
- [ ] 남은 좌석처럼 **폴링으로 바뀌는 값은 바뀔 때마다 읽어주지 않는다** (스크린 리더 소음). 중요한 변화(마감, 예약 확정, 홀드 만료)만 `role="status"`(정중) 또는 `role="alert"`(긴급)로 안내
- [ ] 로딩 중인 영역은 `aria-busy`, 완료 후 결과를 status로 안내
- [ ] 홀드 남은 시간 카운트다운은 매초 읽히지 않게 하고, 1분 남았을 때 한 번 안내. 시간 연장 수단 고려 (WCAG 2.2.1)
- [ ] 토스트는 자동으로 사라지기 전에 읽힐 시간을 주고, 중요한 정보는 토스트에만 두지 않음

### 시각
- [ ] 텍스트 대비 4.5:1, 큰 텍스트·UI 경계 3:1 (light/dark 모두). 색만으로 상태를 구분하지 않음 (Badge는 텍스트 포함)
- [ ] 200% 확대, 320px 폭에서 가로 스크롤 없이 사용 가능
- [ ] 터치 대상 최소 24×24px
- [ ] `prefers-reduced-motion`에서 애니메이션 줄이기

## 키보드 테스트 템플릿

```tsx
it('키보드만으로 회차를 고르고 예약할 수 있다', async () => {
  renderWithQuery(<SessionPicker classId="c1" />);
  await userEvent.tab();                       // 첫 라디오로
  await userEvent.keyboard('{ArrowDown}');     // 다음 회차
  expect(screen.getAllByRole('radio')[1]).toBeChecked();
  await userEvent.tab();                       // 예약 버튼
  expect(screen.getByRole('button', { name: '예약하기' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
});
```

## 보고 형식

```
[차단|심각|보통|경미] path:줄 — 문제 (WCAG 기준 번호)
  영향: 누가(키보드/스크린 리더/저시력) 무엇을 못 하는가
  수정: 구체적인 코드 변경
```

DS 컴포넌트 자체의 문제는 앱에서 우회하고, DS 저장소에 올릴 이슈로 따로 적는다.
