import { describe, expect, it } from 'vitest';
import { CATEGORIES, categoryHref, parseCategory } from './category';

describe('parseCategory', () => {
  it('알려진 값만 받고 나머지는 전체(undefined)로 본다', () => {
    expect(parseCategory('FLOWER')).toBe('FLOWER');
    expect(parseCategory(['DRAWING', 'CRAFT'])).toBe('DRAWING');
    expect(parseCategory('flower')).toBeUndefined();
    expect(parseCategory(undefined)).toBeUndefined();
  });

  it('빈 문자열과 빈 배열도 전체로 본다', () => {
    expect(parseCategory('')).toBeUndefined();
    expect(parseCategory([])).toBeUndefined();
  });
});

describe('categoryHref', () => {
  it('카테고리가 있으면 ?category=, 없으면 "/"', () => {
    expect(categoryHref('CRAFT')).toBe('/?category=CRAFT');
    expect(categoryHref(undefined)).toBe('/');
  });

  it('모든 카테고리의 주소를 parseCategory가 다시 읽을 수 있다', () => {
    for (const category of CATEGORIES) {
      const value = new URL(categoryHref(category), 'http://localhost').searchParams.get('category') ?? undefined;
      expect(parseCategory(value)).toBe(category);
    }
  });
});
