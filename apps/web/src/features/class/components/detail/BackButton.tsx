'use client';

import Link from 'next/link';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { useBackNavigation } from '@/features/class/hooks/useBackNavigation';
import { roundButtonClass } from '@/features/class/styles/detail-classes';

/**
 * 뒤로 가기. 기본은 홈 링크(JS 없이도 동작)이고, 바로 앞 화면이 앱 안의 목록일 때만 history.back으로 돌아가
 * 목록에서 불러온 페이지·스크롤 위치를 그대로 살린다. 외부에서 바로 들어왔거나 다른 화면에서 왔으면 홈으로 간다.
 */
export function BackButton() {
  const { onClick } = useBackNavigation();

  return (
    <Link
      href="/"
      className={cn(roundButtonClass, 'lg:w-auto lg:grid-flow-col lg:gap-1 lg:pr-4 lg:pl-3')}
      onClick={onClick}
      aria-label="뒤로 가기"
    >
      <ChevronLeftIcon />
      <span className="sr-only lg:not-sr-only" aria-hidden="true">
        뒤로
      </span>
    </Link>
  );
}
