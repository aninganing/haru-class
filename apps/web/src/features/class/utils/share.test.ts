import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockMatchMedia, mockNavigator } from '@/test/browser-apis';
import { canNativeShare, isShareAbort } from './share';

describe('canNativeShare', () => {
  let restore = () => {};
  afterEach(() => restore());

  it('터치 기기(pointer: coarse)이고 navigator.share가 있으면 true', () => {
    mockMatchMedia(['(pointer: coarse)']);
    restore = mockNavigator({ share: () => Promise.resolve() });
    expect(canNativeShare()).toBe(true);
  });

  it('PC(정밀 포인터)면 share가 있어도 false', () => {
    mockMatchMedia([]);
    restore = mockNavigator({ share: () => Promise.resolve() });
    expect(canNativeShare()).toBe(false);
  });

  it('share가 없으면 터치 기기여도 false', () => {
    mockMatchMedia(['(pointer: coarse)']);
    restore = mockNavigator({});
    expect(canNativeShare()).toBe(false);
  });

  it('matchMedia가 없는 환경이면 false (예외 없이)', () => {
    vi.stubGlobal('matchMedia', undefined);
    restore = mockNavigator({ share: () => Promise.resolve() });
    expect(canNativeShare()).toBe(false);
  });
});

describe('isShareAbort', () => {
  it.each([
    ['DOMException AbortError', new DOMException('cancel', 'AbortError'), true],
    ['DOMException NotAllowedError', new DOMException('denied', 'NotAllowedError'), false],
    ['이름만 AbortError인 일반 Error', Object.assign(new Error('x'), { name: 'AbortError' }), false],
    ['TypeError', new TypeError('x'), false],
    ['문자열', 'AbortError', false],
    ['undefined', undefined, false],
  ])('%s → %s', (_, error, expected) => {
    expect(isShareAbort(error)).toBe(expected);
  });
});
