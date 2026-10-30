import '@aninganing/react/style.css';
import '../src/app/globals.css';

import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';

const preview: Preview = {
  parameters: {
    nextjs: { appDirectory: true },
    // 시안(390px 모바일)과 PC 확인용. 스토리에서 globals: { viewport: { value: 'haruMobile' } }로 고른다.
    // addon-vitest도 이 값으로 브라우저 크기를 바꾼다 (pnpm test:storybook).
    viewport: {
      options: {
        ...MINIMAL_VIEWPORTS,
        haruMobile: { name: '하루 모바일 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
        haruTablet: { name: '하루 태블릿 820', styles: { width: '820px', height: '1180px' }, type: 'tablet' },
        haruDesktop: { name: '하루 PC 1280', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
      },
    },
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
