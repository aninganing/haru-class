import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
    document.cookie = 'theme=; max-age=0; path=/';
  });

  it('켜면 html의 data-theme과 쿠키를 dark로 바꾼다', async () => {
    render(<ThemeToggle initialTheme="light" />);

    await userEvent.click(screen.getByRole('switch', { name: '다크 모드' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.cookie).toContain('theme=dark');
    expect(screen.getByRole('switch', { name: '다크 모드' })).toBeChecked();
  });

  it('키보드(Tab → Space)로 조작할 수 있다', async () => {
    render(<ThemeToggle initialTheme="light" />);
    const toggle = screen.getByRole('switch', { name: '다크 모드' });

    await userEvent.tab();
    expect(toggle).toHaveFocus();
    await userEvent.keyboard(' ');

    expect(toggle).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('접근성 위반이 없다', async () => {
    const { container } = render(<ThemeToggle initialTheme="light" />);
    await expectNoA11yViolations(container);
  });
});
