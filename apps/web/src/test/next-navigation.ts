import { vi } from 'vitest';

/**
 * next/navigation 모킹용 상태. 테스트 파일에서 아래처럼 쓴다 (vi.mock은 파일 맨 위로 끌어올려진다).
 *
 *   vi.mock('next/navigation', async () => (await import('@/test/next-navigation')).navigationMock);
 *   beforeEach(() => resetNavigation('/'));
 *   expect(router.push).toHaveBeenCalledWith('/?category=CRAFT', { scroll: false });
 */
export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

let pathname = '/';

export function resetNavigation(path = '/') {
  pathname = path;
  Object.values(router).forEach((fn) => fn.mockReset());
}

export const navigationMock = {
  useRouter: () => router,
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
};
