import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import type { Theme } from '@/lib/theme';
import { HeaderNav } from './MainNav';
import { cn } from '@/lib/cn';
import { containerClass } from './layout-classes';

interface AppHeaderProps {
  theme: Theme;
  /** 상세처럼 모바일·태블릿에서 화면 위를 콘텐츠가 채우는 페이지는 64rem 미만에서 숨긴다 */
  hideBelowLg?: boolean;
}

export function AppHeader({ theme, hideBelowLg }: AppHeaderProps) {
  return (
    <header className={hideBelowLg ? 'hidden lg:block' : undefined}>
      <div className={cn(containerClass, 'flex h-14 items-center gap-6 border-b border-line')}>
        <Link href="/" className="shrink-0 text-400 font-bold tracking-tight whitespace-nowrap">
          하루클래스
        </Link>
        <HeaderNav />
        {/* DS Switch는 부모 폭을 채우므로 내용 폭만큼만 차지하는 영역에 둔다 */}
        <div className="ml-auto">
          <ThemeToggle initialTheme={theme} />
        </div>
      </div>
    </header>
  );
}
