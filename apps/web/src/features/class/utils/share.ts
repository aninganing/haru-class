/** 터치 기기(모바일)이고 Web Share를 지원하면 공유 시트를 쓴다. 그 외에는 링크 복사. */
export const canNativeShare = () =>
  typeof navigator.share === 'function' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches;

/** 사용자가 공유 시트를 닫은 경우. 실패가 아니라 취소라 아무것도 하지 않는다. */
export const isShareAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';
