import type { StorybookConfig } from '@storybook/nextjs-vite';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// pnpm 모노레포에서 애드온·프레임워크를 이 앱의 node_modules 기준으로 찾는다 (DS Storybook과 같은 방식)
const getAbsolutePath = (value: string): string =>
  dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-themes'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/nextjs-vite'),
    options: {},
  },
};

export default config;
