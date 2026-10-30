import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomTabBar } from '@/components/layout/MainNav';
import { containerClass, mainWithTabBarClass } from '@/components/layout/layout-classes';
import { cn } from '@/lib/cn';
import { THEME_COOKIE, parseTheme } from '@/lib/theme';

/** 홈·내 예약·상태: 헤더 + (모바일) 하단 탭 */
export default async function MainLayout({ children }: { children: ReactNode }) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <>
      <AppHeader theme={theme} />
      <main id="main" className={cn(containerClass, mainWithTabBarClass)}>
        {children}
      </main>
      <BottomTabBar />
    </>
  );
}
