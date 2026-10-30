'use client';

import { IconButton } from '@aninganing/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import { ClassThumbnail } from '@/features/class/components/ClassThumbnail';
import { useGalleryNavigation } from '@/features/class/hooks/useGalleryNavigation';
import { cn } from '@/lib/cn';
import { focusRingClass } from '@/features/class/styles/detail-classes';

const SIZES = '(max-width: 64rem) 100vw, 46rem';
const galleryClass = 'relative bg-surface-subtle md:overflow-hidden md:rounded-lg';
const slideClass = 'relative h-73 w-full flex-none snap-start md:h-96';
/**
 * 이전/다음 버튼(DS IconButton overlay)을 감싸는 자리.
 * IconButton은 자기 position을 relative로 고정하므로 배치(absolute)와 보이기 규칙은 이 감싸개가 맡는다.
 * 모바일(터치)은 스와이프가 기본이라 투명하게 숨기되 누르지도 못하게(pointer-events-none) 하고,
 * 키보드 포커스를 받았을 때만 보이고 눌린다. 정밀 포인터(마우스)에서는 항상 보인다.
 */
const galleryButtonSlotClass =
  'pointer-events-none absolute top-1/2 z-1 -translate-y-1/2 opacity-0 has-focus-visible:pointer-events-auto has-focus-visible:opacity-100 pointer-fine:pointer-events-auto pointer-fine:opacity-100';
/** 처음·끝에서는 aria-disabled. DS 색이 레이어 밖이라 important로 덮는다 */
const disabledEdgeClass = 'aria-disabled:cursor-default! aria-disabled:text-fg-subtle!';

interface ClassGalleryProps {
  images: string[];
}

/**
 * 클래스 사진 갤러리 (자동 회전 없음, APG Carousel 패턴).
 * - 넘기기: 터치 스와이프(scroll-snap), 스크롤 영역 포커스 후 방향키(브라우저 기본 스크롤), 이전/다음 버튼
 * - 슬라이드는 role="group" + "2 / 6" 라벨. 버튼으로 넘길 때만 status로 "사진 2 / 6"을 알린다 (스와이프마다 읽지 않음)
 * - 처음·끝의 버튼은 disabled 대신 aria-disabled — 누른 버튼에서 포커스가 빠지지 않게 한다
 * - 버튼으로 넘기는 동안(smooth 스크롤)에는 지나가는 슬라이드를 observer가 알려도 무시한다.
 *   목표 슬라이드가 보이거나, scrollend, 사용자의 직접 스크롤, 시간 초과 중 하나가 오면 다시 따라간다.
 * - contracts에 사진 설명이 없어 이미지는 alt=""로 두고 슬라이드 라벨로 위치만 알린다
 */
export function ClassGallery({ images }: ClassGalleryProps) {
  const total = images.length;
  // 현재 장·버튼 이동·이동 중 observer 무시·안내는 훅이 맡는다
  const { scrollRef, slideRef, current, announcement, isFirst, isLast, goPrev, goNext } = useGalleryNavigation(total);

  if (total === 0) {
    return (
      <div className={galleryClass}>
        <div className={slideClass}>
          <ClassThumbnail src={null} sizes={SIZES} />
        </div>
      </div>
    );
  }

  return (
    <section className={galleryClass} aria-roledescription="carousel" aria-label="클래스 사진">
      {/* 이미지만 있는 스크롤 영역이라 키보드로 스크롤할 수 있게 포커스를 받는다 (axe scrollable-region-focusable) */}
      <div
        ref={scrollRef}
        className={cn(
          'scrollbar-none flex snap-x snap-mandatory overflow-x-auto motion-safe:scroll-smooth',
          focusRingClass,
        )}
        tabIndex={total > 1 ? 0 : undefined}
        aria-label={total > 1 ? '사진 목록, 방향키로 넘기기' : undefined}
        role={total > 1 ? 'region' : undefined}
      >
        {images.map((src, i) => (
          <div
            // 같은 URL이 두 번 와도 key가 겹치지 않게 위치를 함께 쓴다
            key={`${i}-${src}`}
            ref={slideRef(i)}
            className={slideClass}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${total}`}
          >
            {/* 불러오지 못하면 이 슬라이드만 기본 이미지 영역으로 바뀐다 (ClassThumbnail의 onError) */}
            <ClassThumbnail src={src} sizes={SIZES} preload={i === 0} />
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <span className={cn(galleryButtonSlotClass, 'left-3')}>
            <IconButton
              variant="overlay"
              shape="round"
              className={disabledEdgeClass}
              aria-label="이전 사진"
              aria-disabled={isFirst}
              onClick={goPrev}
            >
              <ChevronLeftIcon />
            </IconButton>
          </span>
          <span className={cn(galleryButtonSlotClass, 'right-3')}>
            <IconButton
              variant="overlay"
              shape="round"
              className={disabledEdgeClass}
              aria-label="다음 사진"
              aria-disabled={isLast}
              onClick={goNext}
            >
              <ChevronRightIcon />
            </IconButton>
          </span>
          <span
            className="absolute right-3 bottom-3 rounded-full bg-surface-inverse px-2 text-50 text-fg-inverse tabular-nums"
            aria-hidden="true"
          >
            {current + 1} / {total}
          </span>
          <p role="status" className="sr-only">
            {announcement}
          </p>
        </>
      )}
    </section>
  );
}
