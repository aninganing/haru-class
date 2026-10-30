import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { containerClass } from '@/components/layout/layout-classes';
import { THEME_COOKIE, parseTheme } from '@/lib/theme';

/** 클래스 상세: 하단 탭 없음. 64rem 미만에서는 갤러리가 화면 위를 채우므로 헤더도 숨긴다. */
export default async function ClassesLayout({ children }: { children: ReactNode }) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <>
      <AppHeader theme={theme} hideBelowLg />
      <main id="main" className={containerClass}>
        {children}
      </main>
    </>
  );
}
