// 'use client'를 두지 않는다: 컴포넌트 경계가 아니라 클라이언트 컴포넌트(Providers, BackButton)가 import하는 훅·헬퍼다.
// 서버에서 import하면 next/navigation 훅 때문에 바로 빌드 에러가 나므로 잘못 쓰일 일이 없다.

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** history.state에 남기는 키. Next가 쓰는 내부 키(__NA 등)와 겹치지 않게 한다. */
const KEY = '__haru';

/** history 항목 하나의 기록: 이 탭에서 앱에 들어온 뒤 몇 번째 항목인지, 직전 경로는 무엇이었는지 */
interface Entry {
  idx: number;
  from: string | null;
}

// 브라우저 탭 하나에서만 의미가 있는 값이라 모듈 변수로 둔다 (서버에서는 쓰지 않는다).
let current: Entry | null = null;
let lastPathname: string | null = null;

/**
 * 뒤로 버튼이 history.back을 써도 되는지: 이 항목 바로 앞이 앱 안의 목록(`/`, 카테고리 포함)일 때만.
 * - 외부에서 바로 들어온 항목(idx 0)은 back 하면 앱 밖으로 나가므로 안 된다 (T5)
 * - 상세 ↔ 회차 선택처럼 다른 화면에서 링크로 온 항목은 back 하면 두 화면을 오가므로 안 된다 (T6)
 */
export const canGoBackToList = () => current !== null && current.idx > 0 && current.from === '/';

/** 테스트용 초기화 */
export function resetNavigationHistory() {
  current = null;
  lastPathname = null;
  window.history.replaceState(null, '');
}

/**
 * 경로가 바뀔 때마다 지금 history 항목에 { idx, from }을 기록한다 (Next 16은 네이티브 replaceState를 라우터와 연동한다).
 * 브라우저 뒤로/앞으로로 돌아온 항목은 이미 기록이 있으므로 그 값을 그대로 쓴다. Strict Mode에서 두 번 돌아도 같다.
 * document.referrer나 이동 횟수는 뒤로 가기·외부 진입을 구분하지 못해 쓰지 않는다.
 */
export function useTrackNavigation() {
  const pathname = usePathname();
  useEffect(() => {
    const state: Record<string, unknown> = window.history.state ?? {};
    const saved = state[KEY] as Entry | undefined;
    if (saved) {
      current = saved;
    } else {
      const entry: Entry = current === null ? { idx: 0, from: null } : { idx: current.idx + 1, from: lastPathname };
      window.history.replaceState({ ...state, [KEY]: entry }, '');
      current = entry;
    }
    lastPathname = pathname;
  }, [pathname]);
}
