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

  // 회귀: 다크로 바꾼 뒤 다른 레이아웃으로 갔다가 뒤로 가면, 헤더가 캐시된(라이트 시절) payload로 다시 마운트된다.
  // 이때 html은 여전히 dark이므로 스위치도 dark여야 한다.
  it('서버 초기값이 light여도 html이 dark면 켜진 상태로 보인다', () => {
    document.documentElement.dataset.theme = 'dark';

    render(<ThemeToggle initialTheme="light" />);

    expect(screen.getByRole('switch', { name: '다크 모드' })).toBeChecked();
  });

  it('다른 곳(다른 스위치 인스턴스 등)이 html 테마를 바꾸면 따라간다', async () => {
    document.documentElement.dataset.theme = 'light';
    render(<ThemeToggle initialTheme="light" />);

    document.documentElement.dataset.theme = 'dark';

    expect(await screen.findByRole('switch', { name: '다크 모드', checked: true })).toBeInTheDocument();
  });

  it('접근성 위반이 없다', async () => {
    const { container } = render(<ThemeToggle initialTheme="light" />);
    await expectNoA11yViolations(container);
  });
});
