'use client';

import { type RefObject, useRef } from 'react';

interface HorizontalScroller<T extends HTMLElement> {
  /** 가로 스크롤 요소에 붙인다 */
  ref: RefObject<T | null>;
  /** 한 화면(폭 × ratio)만큼 왼쪽으로 */
  scrollPrev: () => void;
  /** 한 화면(폭 × ratio)만큼 오른쪽으로 */
  scrollNext: () => void;
}

/**
 * 가로 스크롤 줄의 이전/다음 버튼 동작. 다음 항목 일부가 보이도록 폭의 ratio(기본 0.9)만큼 넘긴다.
 * 부드럽게 넘길지는 CSS(scroll-behavior, prefers-reduced-motion)가 정한다.
 */
export function useHorizontalScroller<T extends HTMLElement = HTMLElement>(ratio = 0.9): HorizontalScroller<T> {
  const ref = useRef<T>(null);
  const scrollBy = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * ratio });
  };
  return { ref, scrollPrev: () => scrollBy(-1), scrollNext: () => scrollBy(1) };
}
