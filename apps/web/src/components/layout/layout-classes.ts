// 레이아웃 공용 클래스. 'use client'가 없는 모듈이라 서버 레이아웃·스토리 어디서든 쓴다.

/** 본문 폭 (72rem) + 좌우 여백 */
export const containerClass = 'mx-auto max-w-content px-5';

/** 하단 탭이 있는 페이지의 main: 모바일은 탭바만큼 아래를 비우고, md 이상(탭바 없음)은 space-12 */
export const mainWithTabBarClass = 'pt-5 pb-tabbar md:pb-12';
