import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// 실제 PostgreSQL·Redis가 필요하다 (pnpm db:up). 앱 전체를 띄워 HTTP로 검증한다.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    setupFiles: ['dotenv/config'],
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
