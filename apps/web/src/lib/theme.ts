export const THEME_COOKIE = 'theme';
export type Theme = 'light' | 'dark';

export const parseTheme = (value: string | undefined): Theme => (value === 'dark' ? 'dark' : 'light');
