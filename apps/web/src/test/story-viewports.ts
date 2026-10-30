/** 스토리용 viewport (.storybook/preview.tsx의 프리셋). addon-vitest도 이 크기로 브라우저를 바꾼다. */
export const mobileViewport = { globals: { viewport: { value: 'haruMobile', isRotated: false } } };
export const tabletViewport = { globals: { viewport: { value: 'haruTablet', isRotated: false } } };
export const desktopViewport = { globals: { viewport: { value: 'haruDesktop', isRotated: false } } };
