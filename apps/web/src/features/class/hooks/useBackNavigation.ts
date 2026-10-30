'use client';

import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { canGoBackToList } from '@/lib/navigation-history';

/**
 * 뒤로 가기 링크(기본 href="/")의 클릭 처리.
 * 바로 앞 화면이 앱 안의 목록일 때만 history.back으로 돌아가 목록의 페이지·스크롤을 살린다.
 * 외부에서 바로 들어왔거나 다른 화면에서 왔으면 링크 기본 동작(홈으로)을 둔다.
 * 새 탭 열기(⌘/Ctrl/Shift·가운데 클릭)는 브라우저 기본 동작에 맡긴다.
 */
export function useBackNavigation() {
  const router = useRouter();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    if (!canGoBackToList()) return;
    event.preventDefault();
    router.back();
  };
  return { onClick };
}
