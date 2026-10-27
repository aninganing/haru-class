import js from '@eslint/js';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import storybook from 'eslint-plugin-storybook';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

// 설정 객체의 files 패턴을 특정 패키지 아래로 한정한다 (패턴은 이 파일 기준 상대 경로).
const scope = (dir, configs, fallback = ['**/*.{js,jsx,mjs,ts,tsx}']) =>
  configs.map((config) => ({
    ...config,
    files: (config.files ?? fallback).map((pattern) => `${dir}/${pattern}`),
  }));

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/dist-check/**',
    '**/.next/**',
    '**/.next-check/**',
    '**/.turbo/**',
    '**/storybook-static/**',
    '**/coverage/**',
    'apps/api/src/generated/**',
    'apps/web/next-env.d.ts',
  ]),

  // 공통: JS 권장 + TypeScript 권장 (web은 Next 설정이 typescript-eslint를 포함하므로 제외)
  ...scope('packages', [js.configs.recommended, ...tseslint.configs.recommended]),
  ...scope('apps/api', [js.configs.recommended, ...tseslint.configs.recommended]),
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    },
  },

  // api (Nest, Node)
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      // Nest DI는 생성자 파라미터 타입을 런타임에 읽으므로 type-only import로 바꾸면 깨진다
      '@typescript-eslint/consistent-type-imports': 'off',
      // 모듈 클래스(@Module)는 본문이 비어 있는 것이 정상
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },

  // web (Next 16 + React + 접근성)
  ...scope('apps/web', [...nextVitals, ...nextTs]),
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    // 패키지 폴더에서 eslint를 실행해도 같은 경로가 되도록 절대 경로로 준다
    settings: { next: { rootDir: fileURLToPath(new URL('./apps/web', import.meta.url)) } },
    // jsx-a11y 플러그인은 Next 설정이 이미 등록했으므로 규칙만 추가한다
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      'jsx-a11y/no-autofocus': 'error',
    },
  },
  // 플러그인만 등록하는 객체(files 없음)는 그대로 두고, 규칙 객체만 web으로 한정한다
  ...storybook.configs['flat/recommended'].map((config) =>
    config.files ? scope('apps/web', [config])[0] : config,
  ),
  {
    // 테스트·스토리에서는 빈 함수(정리 함수 자리 표시)를 허용한다
    files: ['apps/web/**/*.{test,stories}.tsx', 'apps/web/src/test/**'],
    rules: { '@typescript-eslint/no-empty-function': 'off' },
  },
]);
