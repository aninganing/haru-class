import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('조건부 클래스를 합친다', () => {
    expect(cn('p-2', false && 'hidden', ['text-fg'])).toBe('p-2 text-fg');
  });

  it('같은 그룹은 뒤의 값이 이긴다', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-fg', 'text-fg-subtle')).toBe('text-fg-subtle');
    expect(cn('text-100', 'text-200')).toBe('text-200');
  });

  it('토큰 글자 크기와 토큰 글자 색은 서로 지우지 않는다', () => {
    expect(cn('text-100', 'text-fg-subtle')).toBe('text-100 text-fg-subtle');
  });
});
