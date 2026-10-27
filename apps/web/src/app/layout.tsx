import '@aninganing/react/style.css';
import './globals.css';

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { THEME_COOKIE, parseTheme } from '@/lib/theme';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: { default: '하루클래스', template: '%s | 하루클래스' },
  description: '원데이 클래스 예약',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // 서버에서 테마를 정해 두어야 첫 화면이 깜빡이지 않는다.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang="ko" data-theme={theme}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard-dynamic-subset.css"
        />
      </head>
      <body>
        <Providers>
          <div className="container">
            <header className="header">
              <Link href="/" className="logo">
                하루클래스
              </Link>
              <div className="header-actions">
                <ThemeToggle initialTheme={theme} />
              </div>
            </header>
            <main className="main">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
