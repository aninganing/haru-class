'use client';

import { CLASS_CATEGORY_LABELS, type ClassCategory } from '@haru/contracts';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { categoryHref } from '@/features/class/utils/category';

/**
 * 카테고리 칩의 이동과 안내.
 * - go: URL(`?category=`)로 push (뒤로 가기 = 이전 필터), scroll: false. 같은 카테고리면 이동하지 않는다.
 * - isPending: 서버가 새 카테고리 목록을 그리는 동안 true (칩 묶음 aria-busy)
 * - announcement: 카테고리가 바뀌면 "{카테고리} 클래스를 보여드려요". 처음 화면에서는 비어 있다.
 *   목록·마감 임박은 카테고리별 key로 다시 마운트되므로, 다시 마운트되지 않는 칩 쪽 status에 둔다.
 */
export function useCategoryNavigation(category?: ClassCategory) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const go = (next?: ClassCategory) => {
    if (next === category) return;
    startTransition(() => router.push(categoryHref(next), { scroll: false }));
  };

  const [seenCategory, setSeenCategory] = useState(category);
  const [announcement, setAnnouncement] = useState('');
  if (category !== seenCategory) {
    setSeenCategory(category);
    setAnnouncement(`${category ? CLASS_CATEGORY_LABELS[category] : '전체'} 클래스를 보여드려요`);
  }

  return { go, isPending, announcement };
}
