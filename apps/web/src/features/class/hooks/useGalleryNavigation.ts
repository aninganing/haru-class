'use client';

import { useEffect, useRef, useState } from 'react';

/** scrollend를 지원하지 않거나 목표에 끝내 닿지 못해도 잠금이 풀리도록 */
export const PROGRAMMATIC_SCROLL_TIMEOUT_MS = 1_500;
/** 버튼 이동 잠금을 푸는 이벤트: 스크롤 끝, 또는 사용자가 직접 스크롤을 시작함 */
const RELEASE_EVENTS = ['scrollend', 'pointerdown', 'wheel', 'touchstart'] as const;

/**
 * 갤러리(가로 scroll-snap)의 현재 장과 버튼 이동.
 * - current: 지금 보이는 슬라이드. 스와이프·방향키 스크롤은 IntersectionObserver(threshold 0.6)로 따라간다
 * - goTo(i): 버튼 이동. 그 장으로 스크롤하고 current를 바로 바꾸며 "사진 i / N"을 announcement로 알린다 (스와이프는 알리지 않음)
 * - 버튼 이동 중(smooth 스크롤)에는 지나가는 슬라이드를 observer가 알려도 무시한다. 목표 슬라이드가 보이거나,
 *   scrollend·사용자의 직접 스크롤(pointerdown·wheel·touchstart), 1.5초 초과 중 하나가 오면 다시 따라간다
 *
 * scrollRef는 스크롤 영역에, slideRef(i)는 i번째 슬라이드에 붙인다. 슬라이드는 모두 스크롤 영역 폭과 같다고 본다.
 */
export function useGalleryNavigation(total: number) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [current, setCurrent] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  /** 버튼으로 이동 중인 목표 슬라이드. null이면 observer를 그대로 따른다 */
  const targetRef = useRef<number | null>(null);
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const release = () => {
    targetRef.current = null;
    clearTimeout(releaseTimerRef.current);
  };

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    RELEASE_EVENTS.forEach((name) => root.addEventListener(name, release, { passive: true }));
    return () => {
      RELEASE_EVENTS.forEach((name) => root.removeEventListener(name, release));
      clearTimeout(releaseTimerRef.current);
    };
  }, [total]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || total < 2 || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = slideRefs.current.indexOf(entry.target as HTMLDivElement);
          if (index < 0) continue;
          if (targetRef.current !== null) {
            // 버튼 이동 중: 지나가는 슬라이드는 무시하고, 목표에 도착하면 잠금을 푼다
            if (index !== targetRef.current) continue;
            release();
          }
          setCurrent(index);
        }
      },
      { root, threshold: 0.6 },
    );
    slideRefs.current.forEach((slide) => slide && observer.observe(slide));
    return () => observer.disconnect();
  }, [total]);

  const goTo = (index: number) => {
    if (index < 0 || index >= total) return;
    targetRef.current = index;
    clearTimeout(releaseTimerRef.current);
    releaseTimerRef.current = setTimeout(release, PROGRAMMATIC_SCROLL_TIMEOUT_MS);
    scrollRef.current?.scrollTo?.({ left: index * scrollRef.current.clientWidth });
    setCurrent(index);
    setAnnouncement(`사진 ${index + 1} / ${total}`);
  };

  /** i번째 슬라이드에 붙일 ref 콜백 */
  const slideRef = (index: number) => (el: HTMLDivElement | null) => {
    slideRefs.current[index] = el;
  };

  return {
    scrollRef,
    slideRef,
    current,
    announcement,
    isFirst: current === 0,
    isLast: current === total - 1,
    goTo,
    goPrev: () => goTo(current - 1),
    goNext: () => goTo(current + 1),
  };
}
