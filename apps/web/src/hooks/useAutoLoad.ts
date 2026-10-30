'use client';

import { type RefObject, useEffect, useEffectEvent, useRef } from 'react';

interface UseAutoLoadOptions {
  /** false면 observer를 만들지 않는다 (요청 중·에러·끝일 때) */
  enabled: boolean;
  /** 감시 요소가 (rootMargin 포함) 화면에 들어오면 호출된다. 매 렌더 새 함수여도 observer를 다시 만들지 않는다. */
  onLoad: () => void;
  /** 화면에 닿기 전에 미리 부르는 거리 (예: '0px 0px 200px 0px') */
  rootMargin?: string;
  /**
   * 바뀌면 observer를 다시 만든다. 새 observer는 처음에 한 번 콜백하므로,
   * 불러온 뒤에도 감시 요소가 계속 보이면(큰 화면·항목이 적을 때) 이어서 부르게 된다. 보통 불러온 페이지 수.
   */
  resetKey?: unknown;
}

/**
 * 목록 끝 감시(IntersectionObserver)로 자동 로드한다. 반환한 ref를 목록 끝의 감시 요소(sentinel)에 붙인다.
 * IntersectionObserver가 없는 환경에서는 아무것도 하지 않는다 (버튼 같은 대체 수단을 함께 둔다).
 */
export function useAutoLoad<T extends Element = HTMLDivElement>({
  enabled,
  onLoad,
  rootMargin = '0px',
  resetKey,
}: UseAutoLoadOptions): RefObject<T | null> {
  const ref = useRef<T>(null);
  const load = useEffectEvent(onLoad);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) load();
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, rootMargin, resetKey]);

  return ref;
}
