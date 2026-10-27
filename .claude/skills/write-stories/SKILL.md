---
name: write-stories
description: haru-class apps/web의 Storybook 10(nextjs-vite) 스토리 작성 가이드. 상태별 스토리 구성, mockFetch로 API 응답 주입, play 상호작용 테스트, 테마·접근성 애드온 사용법. 컴포넌트를 만들거나 바꿀 때, test-engineer가 작업할 때 사용한다.
---

# 스토리 작성

## 원칙

- 컴포넌트 파일 옆에 `<Thing>.stories.tsx`. title은 `<Domain>/<Thing>` (예: `Booking/SessionPicker`).
- **화면이 다르게 보이는 상태마다 스토리 하나.** 최소: 기본, 로딩, 비어 있음, 에러. 도메인 상태가 있으면 추가 (마감, 홀드 만료, 결제 대기 등).
- 스토리 이름은 상태를 나타내는 PascalCase: `Default`, `Loading`, `Empty`, `ApiError`, `SoldOut`.
- 긴 텍스트, 많은 항목, 좁은 화면처럼 레이아웃이 깨지기 쉬운 경우도 스토리로 만든다 (`parameters.viewport`).

## 템플릿

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { json, mockFetch } from '@/test/mock-fetch';
import { SessionPicker } from './SessionPicker';

const meta = {
  title: 'Booking/SessionPicker',
  component: SessionPicker,
  args: { classId: 'c1' },
} satisfies Meta<typeof SessionPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  beforeEach: () => mockFetch(() => json([{ sessionId: 's1', capacity: 6, remaining: 2, status: 'OPEN' }])),
};

export const Loading: Story = {
  beforeEach: () => mockFetch(() => new Promise<Response>(() => {})), // 응답이 오지 않음
};

export const ApiError: Story = {
  beforeEach: () => mockFetch(() => json({ statusCode: 500, message: '잠시 후 다시 시도해 주세요' }, 500)),
};

export const SelectWithKeyboard: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('radio', { checked: true })).toBeInTheDocument();
  },
};
```

- `beforeEach`는 정리 함수를 반환하면 스토리를 떠날 때 실행된다. `mockFetch`가 그 정리 함수를 반환한다.
- 요청 URL별로 다르게 응답하려면 handler 안에서 `url`을 분기한다.
- 폴링 컴포넌트는 handler 안에서 호출 횟수에 따라 응답을 바꿔 상태 변화를 보여줄 수 있다.

## 이미 설정된 것 (`apps/web/.storybook/preview.tsx`)

- DS `style.css`, `globals.css`, Pretendard 폰트
- 스토리마다 새 QueryClient (retry 없음)
- light/dark 테마 툴바 (`data-theme`). 컴포넌트가 직접 테마를 바꾸면 `parameters: { themes: { disable: true } }`
- a11y 애드온 (`test: 'error'`). Accessibility 패널에서 위반을 확인하고 고친다. 색 대비는 여기서만 검사된다.
- `nextjs.appDirectory: true` — `next/navigation` 훅을 쓰는 컴포넌트는 `parameters.nextjs.navigation`으로 pathname/query를 준다.

## 확인

```bash
pnpm build-storybook        # 모든 스토리가 빌드되는지 (dev 서버와 충돌 없음)
pnpm storybook              # :6006에서 눈으로 확인 (light/dark 둘 다)
```

브라우저로 확인할 수 있으면 `iframe.html?id=<title-kebab>--<story-kebab>&viewMode=story`로 각 스토리를 직접 열어 light/dark를 모두 본다.
