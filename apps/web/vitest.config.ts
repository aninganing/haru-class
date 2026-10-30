import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@': dir('./src') },
  },
  test: {
    projects: [
      {
        // 컴포넌트 단위 테스트 (jsdom). pnpm test
        extends: true,
        plugins: [react()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup.ts'],
          css: false,
        },
      },
      {
        // 모든 스토리를 실제 Chromium에서 렌더링하고 play·a11y 검사를 돌린다. pnpm test:storybook
        extends: true,
        plugins: [storybookTest({ configDir: dir('./.storybook') })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            // pnpm이 vitest@5.0.5를 peer 조합별로 여러 벌 설치해서 @vitest/browser가 다른 벌의 타입을 참조한다.
            // 버전이 같아 실행에는 문제가 없고 타입만 어긋난다 (dedupePeers·jsdom override로도 남음). 의존성 정리 후 제거.
            provider: playwright({}) as never,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
