import { type ClassCategory, classCategorySchema } from '@haru/contracts';

// 'use client'가 없는 모듈이다. 서버 페이지(searchParams 해석)와 클라이언트 칩이 함께 쓴다.
// 클라이언트 모듈의 일반 함수는 서버에서 호출할 수 없다 (클라이언트 참조로 바뀐다).

export const CATEGORIES = classCategorySchema.options;

/** `?category=` 값을 검증한다. 모르는 값은 '전체'(undefined)로 본다. */
export function parseCategory(value: string | string[] | undefined): ClassCategory | undefined {
  const parsed = classCategorySchema.safeParse(Array.isArray(value) ? value[0] : value);
  return parsed.success ? parsed.data : undefined;
}

export const categoryHref = (category?: ClassCategory) => (category ? `/?category=${category}` : '/');
