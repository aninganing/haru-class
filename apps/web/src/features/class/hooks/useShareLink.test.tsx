import type * as DS from '@aninganing/react';
import { toast } from '@aninganing/react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COPIED_MESSAGE } from '@/features/class/constants/messages';
import { mockMatchMedia, mockNavigator } from '@/test/browser-apis';
import { useShareLink } from './useShareLink';

// 토스트 표시는 DS가 맡는다. 훅 테스트에서는 toast 호출만 본다 (실제 렌더링은 ShareButton 테스트)
vi.mock('@aninganing/react', async (importOriginal) => ({
  ...(await importOriginal<typeof DS>()),
  toast: vi.fn(),
}));

/** 훅을 띄우고, 포커스 복귀를 보려고 buttonRef를 실제 버튼에 연결한다 (컴포넌트에서는 IconButton에 붙는다) */
function setup() {
  render(
    <>
      <button>공유하기</button>
      <button>다른 버튼</button>
    </>,
  );
  const view = renderHook(() => useShareLink('성수 도자기'));
  view.result.current.buttonRef.current = screen.getByRole('button', { name: '공유하기' }) as HTMLButtonElement;
  return view;
}

let hook: ReturnType<typeof setup>;
const share = () => act(() => hook.result.current.share());
const failed = () => hook.result.current.failedUrl ?? '';

describe('useShareLink', () => {
  let restore = () => {};
  beforeEach(() => vi.mocked(toast).mockClear());
  afterEach(() => restore());

  it('터치 기기에서 Web Share를 지원하면 공유 시트에 제목과 현재 주소를 넘기고 복사하지 않는다', async () => {
    mockMatchMedia(['(pointer: coarse)']);
    const nativeShare = vi.fn(() => Promise.resolve());
    const writeText = vi.fn(() => Promise.resolve());
    restore = mockNavigator({ share: nativeShare, writeText });
    hook = setup();

    await share();

    expect(nativeShare).toHaveBeenCalledWith({ title: '성수 도자기', url: window.location.href });
    expect(writeText).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });

  it('공유 시트를 사용자가 닫으면(AbortError) 복사·토스트·창 모두 하지 않는다', async () => {
    mockMatchMedia(['(pointer: coarse)']);
    const writeText = vi.fn(() => Promise.resolve());
    restore = mockNavigator({ share: () => Promise.reject(new DOMException('cancel', 'AbortError')), writeText });
    hook = setup();

    await share();

    expect(writeText).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
    expect(failed()).toBe('');
  });

  it('공유가 다른 이유로 실패하면 링크 복사로 넘어가 토스트로 알린다', async () => {
    mockMatchMedia(['(pointer: coarse)']);
    const writeText = vi.fn(() => Promise.resolve());
    restore = mockNavigator({ share: () => Promise.reject(new TypeError('not allowed')), writeText });
    hook = setup();

    await share();

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(toast).toHaveBeenCalledWith({ message: COPIED_MESSAGE });
  });

  it('PC에서는 공유 시트 없이 링크를 복사하고, 복사할 때마다 토스트를 새로 띄운다', async () => {
    mockMatchMedia([]);
    const nativeShare = vi.fn(() => Promise.resolve());
    const writeText = vi.fn(() => Promise.resolve());
    restore = mockNavigator({ share: nativeShare, writeText });
    hook = setup();

    await share();
    await share();

    expect(nativeShare).not.toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(toast).toHaveBeenCalledTimes(2);
    expect(failed()).toBe('');
  });

  it.each([
    ['복사가 거부되면', { writeText: () => Promise.reject(new Error('denied')) }],
    ['clipboard가 없으면', {}],
  ])('%s 토스트 없이 failedUrl에 현재 주소를 담는다 (창 열림)', async (_, apis) => {
    mockMatchMedia([]);
    restore = mockNavigator(apis);
    hook = setup();

    await share();

    expect(failed()).toBe(window.location.href);
    expect(toast).not.toHaveBeenCalled();
  });

  it('closeDialog는 창을 닫고(failedUrl null) 다음 틱에 공유 버튼으로 포커스를 돌린다', async () => {
    mockMatchMedia([]);
    restore = mockNavigator({ writeText: () => Promise.reject(new Error('denied')) });
    hook = setup();
    await share();
    screen.getByRole('button', { name: '다른 버튼' }).focus();

    act(() => hook.result.current.closeDialog());

    expect(failed()).toBe('');
    await waitFor(() => expect(screen.getByRole('button', { name: '공유하기' })).toHaveFocus());
  });
});
