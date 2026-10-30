import { expect, vi } from 'vitest';

/**
 * run 동안 React가 "same key" 경고(console.error)를 내지 않았는지 확인한다.
 * 목록·슬라이드처럼 key가 겹치면 항목이 합쳐지거나 빠질 수 있는 렌더링에 쓴다.
 *
 *   await expectNoReactKeyWarnings(() => render(<ClassGallery images={[a, a, b]} />));
 */
export async function expectNoReactKeyWarnings(run: () => unknown | Promise<unknown>) {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await run();
    const keyWarnings = spy.mock.calls.filter((args) => args.some((arg) => /same key/.test(String(arg))));
    expect(keyWarnings, 'React key 경고').toEqual([]);
  } finally {
    spy.mockRestore();
  }
}
