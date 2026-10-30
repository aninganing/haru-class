// 홈 공용 클래스. 'use client'가 없는 모듈이라 서버·클라이언트 컴포넌트와 스토리 어디서든 쓴다.
// cn()으로 감싸 Prettier(prettier-plugin-tailwindcss, tailwindFunctions)가 클래스 순서를 정렬하게 한다.
import { cn } from '@/lib/cn';

export const sectionClass = cn('mt-8');
export const sectionTitleClass = cn('text-400 leading-tight font-semibold');

/**
 * 가로 스크롤 줄. 모바일은 화면 끝까지 붙게 바깥 여백(px-5)만큼 넓히고, md 이상은 본문 폭 안에 둔다.
 * snap은 proximity로 두어 끝에 가까울 때만 맞춘다 (자식에 snap-start).
 */
export const scrollerClass = cn(
  '-mx-5 scrollbar-none flex snap-x snap-proximity scroll-px-5 gap-3 overflow-x-auto px-5 py-1 motion-safe:scroll-smooth md:mx-0 md:scroll-px-0 md:px-0',
);

/** 새로 열린 클래스 목록: 모바일은 한 줄씩, md 3열 / lg 4열 카드 그리드 */
export const classListClass = cn('md:grid md:grid-cols-3 md:gap-6 lg:grid-cols-4');
