import { vi } from 'vitest';

/**
 * jsdom에 없는 브라우저 API를 테스트마다 설치한다. vi.stubGlobal / defineProperty를 쓰고 정리 함수를 반환한다.
 */

/** window.matchMedia. matches에 true를 줄 쿼리 목록 */
export function mockMatchMedia(matching: string[] = []) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matching.includes(query),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

/** navigator.share / navigator.clipboard. undefined를 주면 지원하지 않는 환경 */
export function mockNavigator({
  share,
  writeText,
}: {
  share?: (data: ShareData) => Promise<void>;
  writeText?: (text: string) => Promise<void>;
}) {
  const shareDesc = Object.getOwnPropertyDescriptor(navigator, 'share');
  const clipboardDesc = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'share', { value: share, configurable: true, writable: true });
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText ? { writeText } : undefined,
    configurable: true,
    writable: true,
  });
  return () => {
    if (shareDesc) Object.defineProperty(navigator, 'share', shareDesc);
    else delete (navigator as { share?: unknown }).share;
    if (clipboardDesc) Object.defineProperty(navigator, 'clipboard', clipboardDesc);
    else delete (navigator as { clipboard?: unknown }).clipboard;
  };
}

/** jsdom에는 Element.scrollTo / scrollBy가 없다 */
export function mockScroll() {
  const scrollTo = vi.fn();
  const scrollBy = vi.fn();
  Object.assign(Element.prototype, { scrollTo, scrollBy });
  return {
    scrollTo,
    scrollBy,
    restore: () => {
      delete (Element.prototype as Partial<Element>).scrollTo;
      delete (Element.prototype as Partial<Element>).scrollBy;
    },
  };
}
