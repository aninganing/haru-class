import { Badge } from '@aninganing/react';
import type { ClassSummary } from '@haru/contracts';
import Link from 'next/link';
import { ClassThumbnail } from '@/features/class/components/ClassThumbnail';
import { formatDuration, formatPrice } from '@/features/class/utils/format';

const THUMBNAIL_SIZES = '(max-width: 48rem) 88px, (max-width: 72rem) 33vw, 18rem';

/** "망원동 · 3시간 · 최대 8명" (정원을 모르면 생략) */
export const classMeta = (item: Pick<ClassSummary, 'neighborhood' | 'durationMinutes' | 'maxCapacity'>) =>
  [item.neighborhood, formatDuration(item.durationMinutes), item.maxCapacity ? `최대 ${item.maxCapacity}명` : null]
    .filter(Boolean)
    .join(' · ');

/** 항목 틀. 모바일은 왼쪽 정사각 썸네일 + 글(시안), md 이상은 세로 카드. Skeleton도 같이 쓴다. */
export const itemClass = 'flex gap-4 border-b border-line py-4 md:flex-col md:gap-3 md:border-b-0 md:py-0';
export const itemThumbClass =
  'relative size-22 shrink-0 overflow-hidden rounded-md bg-surface-subtle md:aspect-4/3 md:h-auto md:w-full';
export const itemBodyClass = 'grid min-w-0 content-start gap-1';

/**
 * 새로 열린 클래스 한 줄. 제목 링크가 항목 전체를 덮는다(stretched link).
 * 포커스 링도 링크 글자가 아니라 항목 전체에 그린다 (WCAG 2.4.7) — 링크 자체 outline은 숨긴다.
 */
export function ClassListItem({ item }: { item: ClassSummary }) {
  return (
    <article
      className={`relative rounded-md ${itemClass} has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus`}
    >
      <div className={itemThumbClass}>
        <ClassThumbnail src={item.thumbnailUrl} sizes={THUMBNAIL_SIZES} />
      </div>
      <div className={itemBodyClass}>
        {item.isNew && (
          <Badge tone="accent" size="sm" className="justify-self-start">
            신규 오픈
          </Badge>
        )}
        <h3 className="text-200 font-semibold wrap-anywhere">
          <Link
            href={`/classes/${item.id}`}
            className="after:absolute after:inset-0 hover:underline focus-visible:outline-hidden"
          >
            {item.title}
          </Link>
        </h3>
        <p className="text-100 text-fg-subtle">{classMeta(item)}</p>
        <p className="mt-1 text-200 font-bold tabular-nums">{formatPrice(item.price)}</p>
      </div>
    </article>
  );
}
