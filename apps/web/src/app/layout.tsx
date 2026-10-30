import '@aninganing/react/style.css';
import './globals.css';

import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { THEME_COOKIE, parseTheme } from '@/lib/theme';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: { default: '하루클래스', template: '%s | 하루클래스' },
  description: '원데이 클래스 예약',
};

// 하단 탭·고정 CTA가 아이폰 홈 인디케이터 영역(safe-area)을 피하도록 viewport-fit=cover
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

/** 헤더·하단 탭은 (main)/layout, classes/layout이 그린다. 여기서는 문서 틀과 Provider만 둔다. */
export default async function RootLayout({ children }: { children: ReactNode }) {
  // 서버에서 테마를 정해 두어야 첫 화면이 깜빡이지 않는다.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    // 하단 탭(모바일)·상세 CTA 바(lg 미만)가 Tab으로 이동한 요소를 가리지 않게 스크롤 여백을 둔다 (WCAG 2.4.11)
    <html
      lang="ko"
      data-theme={theme}
      className="max-lg:has-data-cta-bar:scroll-pb-cta-bar max-md:has-data-tabbar:scroll-pb-tabbar"
    >
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard-dynamic-subset.css"
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only rounded-md bg-surface px-4 py-2 text-fg focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
        >
          본문으로 건너뛰기
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
