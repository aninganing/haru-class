import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Nest DI는 emitDecoratorMetadata가 필요한데 esbuild는 지원하지 않아서 SWC로 변환한다.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
