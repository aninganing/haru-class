import '@aninganing/react/style.css';
import '../src/app/globals.css';

import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const preview: Preview = {
  parameters: {
    nextjs: { appDirectory: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // 검사 대상(context)은 지정하지 않는다. Vitest 브라우저 모드에는 #storybook-root가 없다.
    a11y: {
      test: 'error',
    },
  },
  decorators: [
    // 스토리마다 새 QueryClient. 데이터는 각 스토리의 beforeEach에서 mockFetch로 준다.
    (Story) => (
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <Story />
      </QueryClientProvider>
    ),
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;
