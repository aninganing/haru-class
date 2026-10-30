import { act } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * jsdom에는 IntersectionObserver가 없다. 가짜를 설치하고 진입/이탈을 직접 일으킨다.
 * vi.stubGlobal을 쓰므로 setup.ts의 unstubAllGlobals가 테스트마다 정리한다.
 * 이 헬퍼를 부르지 않은 테스트는 "observer 미지원 환경"이 된다.
 */
export function mockIntersectionObserver() {
  const instances: FakeIntersectionObserver[] = [];

  class FakeIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin: string;
    readonly thresholds: ReadonlyArray<number> = [0];
    readonly scrollMargin = '0px';
    elements = new Set<Element>();
    disconnected = false;

    constructor(
      readonly callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      this.rootMargin = options?.rootMargin ?? '0px';
      instances.push(this);
    }
    observe(el: Element) {
      this.elements.add(el);
    }
    unobserve(el: Element) {
      this.elements.delete(el);
    }
    disconnect() {
      this.disconnected = true;
      this.elements.clear();
    }
    takeRecords() {
      return [];
    }
  }

  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

  const fire = (isIntersecting: boolean, only?: Element) =>
    act(() => {
      for (const io of instances.filter((o) => !o.disconnected)) {
        const targets = [...io.elements].filter((el) => !only || el === only);
        const entries = targets.map(
          (target) => ({ target, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 }) as IntersectionObserverEntry,
        );
        if (entries.length) io.callback(entries, io);
      }
    });

  return {
    /** 활성 observer가 보고 있는 요소가 화면(rootMargin 포함)에 들어왔다고 알린다 */
    /** target을 주면 그 요소만 진입시킨다 (예: 갤러리의 특정 슬라이드) */
    enter: (target?: Element) => fire(true, target),
    leave: (target?: Element) => fire(false, target),
    get active() {
      return instances.filter((o) => !o.disconnected);
    },
  };
}
