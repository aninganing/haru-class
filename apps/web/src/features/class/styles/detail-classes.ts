// 상세 공용 클래스. 'use client'가 없는 모듈이라 서버·클라이언트 컴포넌트 어디서든 쓴다.
// cn()으로 감싸 Prettier(prettier-plugin-tailwindcss, tailwindFunctions)가 클래스 순서를 정렬하게 한다.
import { cn } from '@/lib/cn';

/** 키보드 포커스 표시 (DS 토큰 색) */
export const focusRingClass = cn('focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus');

/** 뒤로 가기 링크(갤러리 위 원형, lg부터 글자 포함). 아이콘만 있는 버튼은 DS IconButton을 쓴다 */
export const roundButtonClass = cn(
  'inline-grid size-10 cursor-pointer place-items-center rounded-full bg-surface text-fg shadow-sm',
  focusRingClass,
);

export const sectionTitleClass = cn('text-400 leading-tight font-semibold');
