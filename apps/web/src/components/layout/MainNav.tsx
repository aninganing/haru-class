'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarIcon, HomeIcon } from '@/components/ui/icons';

const ITEMS = [
  { href: '/', label: '홈', icon: HomeIcon },
  { href: '/bookings', label: '내 예약', icon: CalendarIcon },
] as const;

const isCurrent = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

/** 현재 위치는 색만으로 알리지 않는다 (WCAG 1.4.1): 헤더는 밑줄, 하단 탭은 위쪽 표시선을 함께 쓴다 */
const currentText = 'aria-[current=page]:font-semibold aria-[current=page]:text-fg-accent';

/** PC(≥48rem) 헤더 안의 내비게이션 */
export function HeaderNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="주 메뉴" className="hidden gap-4 md:flex">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
          className={`px-1 py-2 text-fg-subtle decoration-2 underline-offset-8 aria-[current=page]:underline ${currentText}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** 모바일(<48rem) 하단 탭. PC에서는 숨기고 HeaderNav를 쓴다. data-tabbar는 html의 scroll-padding이 참조한다. */
export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="하단 메뉴"
      data-tabbar=""
      className="fixed inset-x-0 bottom-0 z-10 box-content grid h-18 grid-cols-2 border-t border-line bg-surface pb-safe md:hidden"
    >
      {ITEMS.map(({ href, label, icon: ItemIcon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isCurrent(pathname, href) ? 'page' : undefined}
          className={`grid content-center justify-items-center gap-1 border-t-2 border-transparent text-50 text-fg-subtle aria-[current=page]:border-fg-accent ${currentText}`}
        >
          <ItemIcon size={24} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
