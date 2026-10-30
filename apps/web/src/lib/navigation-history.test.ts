import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetNavigation } from '@/test/next-navigation';
import { canGoBackToList, resetNavigationHistory, useTrackNavigation } from './navigation-history';

vi.mock('next/navigation', async () => (await import('@/test/next-navigation')).navigationMock);

/** 앱 안 이동을 흉내 낸다: 새 history 항목을 만들고 경로를 바꾼 뒤 추적 훅을 다시 돌린다 */
function visit(rerender: () => void, path: string) {
  window.history.pushState(null, '', path);
  resetNavigation(path);
  rerender();
}

describe('navigation-history (canGoBackToList)', () => {
  beforeEach(() => {
    resetNavigationHistory();
    resetNavigation('/');
  });

  it('추적을 시작하기 전에는 false', () => {
    expect(canGoBackToList()).toBe(false);
  });

  it('목록(홈)에서 상세로 들어왔으면 true', () => {
    const { rerender } = renderHook(() => useTrackNavigation());
    expect(canGoBackToList()).toBe(false); // 목록 자체는 첫 항목

    visit(rerender, '/classes/c1');

    expect(canGoBackToList()).toBe(true);
  });

  it('외부에서 상세로 바로 들어왔으면 false (back 하면 앱 밖으로 나감, T5)', () => {
    resetNavigation('/classes/c1');
    renderHook(() => useTrackNavigation());

    expect(canGoBackToList()).toBe(false);
  });

  it('외부 진입 → 회차 선택 → 링크로 상세에 돌아오면 false (상세 ↔ 회차 선택 반복 방지, T6)', () => {
    resetNavigation('/classes/c1');
    const { rerender } = renderHook(() => useTrackNavigation());
    visit(rerender, '/classes/c1/sessions');
    visit(rerender, '/classes/c1');

    expect(canGoBackToList()).toBe(false);
  });

  it('카테고리를 고른 목록(/?category=)에서 들어와도 true (경로는 "/")', () => {
    window.history.replaceState(null, '', '/?category=CRAFT');
    const { rerender } = renderHook(() => useTrackNavigation());
    visit(rerender, '/classes/c1');

    expect(canGoBackToList()).toBe(true);
  });

  it('브라우저 뒤로 가기로 돌아온 항목은 기록해 둔 위치를 다시 쓴다 (Strict Mode 두 번 실행에도 그대로)', () => {
    resetNavigation('/classes/c1');
    const { rerender } = renderHook(() => useTrackNavigation(), { reactStrictMode: true });
    const first = window.history.state?.__haru;
    rerender();

    expect(first).toEqual({ idx: 0, from: null });
    expect(window.history.state.__haru).toEqual(first);
  });

  it('기록이 남은 목록 다음 항목으로 돌아오면(앞으로 가기) 그 기록으로 판정한다', () => {
    const { rerender } = renderHook(() => useTrackNavigation());
    visit(rerender, '/classes/c1');
    const detailEntry = window.history.state.__haru;
    visit(rerender, '/classes/c1/sessions');
    expect(canGoBackToList()).toBe(false);

    // 브라우저 뒤로 가기: 상세 항목의 state가 다시 보인다
    window.history.replaceState({ __haru: detailEntry }, '', '/classes/c1');
    resetNavigation('/classes/c1');
    rerender();

    expect(canGoBackToList()).toBe(true);
  });
});
