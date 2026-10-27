import { defineConfig } from 'tsup';

// Nest(api)는 CommonJS, Next(web)는 ESM으로 가져가므로 둘 다 출력한다.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
});
