'use client';

import { Chip } from '@aninganing/react';
import { CLASS_CATEGORY_LABELS, type ClassCategory } from '@haru/contracts';
import { useCategoryNavigation } from '@/features/class/hooks/useCategoryNavigation';
import { CATEGORIES } from '@/features/class/utils/category';
import { cn } from '@/lib/cn';
import { scrollerClass } from '@/features/class/styles/home-classes';

interface CategoryChipsProps {
  /** 현재 선택 (없으면 전체) */
  category?: ClassCategory;
}

/**
 * 카테고리 필터. 상태는 URL(`?category=`)에 둔다 — SSR, 뒤로 가기, 공유가 모두 맞는다.
 * 이동은 push(뒤로 가기 = 이전 필터), scroll: false(칩을 누를 때 화면이 위로 튀지 않게).
 * 선택된 칩을 다시 누르면 전체로 돌아간다 (aria-pressed 토글 의미와 맞춘다).
 */
export function CategoryChips({ category }: CategoryChipsProps) {
  // 이동(push + transition)·전환 중 표시·결과 안내는 훅이 맡는다
  const { go, isPending, announcement } = useCategoryNavigation(category);

  return (
    <>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <div
        role="group"
        aria-label="카테고리"
        aria-busy={isPending || undefined}
        className={cn(scrollerClass, '*:flex-none *:snap-start')}
      >
        <Chip selected={category === undefined} onSelectedChange={() => go(undefined)}>
          전체
        </Chip>
        {CATEGORIES.map((value) => (
          <Chip
            key={value}
            selected={category === value}
            onSelectedChange={(selected) => go(selected ? value : undefined)}
          >
            {CLASS_CATEGORY_LABELS[value]}
          </Chip>
        ))}
      </div>
    </>
  );
}
