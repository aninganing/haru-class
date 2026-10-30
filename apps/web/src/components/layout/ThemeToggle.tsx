'use client';

import { Switch } from '@aninganing/react';
import { useSyncExternalStore } from 'react';
import { THEME_COOKIE, type Theme, parseTheme } from '@/lib/theme';

// 테마의 기준은 <html data-theme> 하나다. 스위치는 상태를 따로 들지 않고 이 속성을 읽는다.
// 헤더는 (main)과 classes 레이아웃에 따로 있어 이동할 때마다 다시 마운트되는데, 뒤로 가기는 캐시된
// (예전 쿠키 기준) payload를 쓰므로 initialTheme이 실제 테마와 다를 수 있다. 서버 렌더링에만 initialTheme을 쓴다.
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
};

const readTheme = (): Theme => parseTheme(document.documentElement.dataset.theme);

export function ThemeToggle({ initialTheme }: { initialTheme: Theme }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => initialTheme);

  const toggle = (dark: boolean) => {
    const next: Theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  return <Switch label="다크 모드" checked={theme === 'dark'} onCheckedChange={toggle} />;
}
