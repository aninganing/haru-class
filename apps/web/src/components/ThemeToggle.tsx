'use client';

import { Switch } from '@aninganing/react';
import { useState } from 'react';
import { THEME_COOKIE, type Theme } from '@/lib/theme';

export function ThemeToggle({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState(initialTheme);

  const toggle = (dark: boolean) => {
    const next: Theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setTheme(next);
  };

  return <Switch label="다크 모드" checked={theme === 'dark'} onCheckedChange={toggle} />;
}
