'use client';

import { Alert, Button, IconButton } from '@aninganing/react';
import type { ClassCategory } from '@haru/contracts';
import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import { scrollerClass, sectionClass, sectionTitleClass } from '@/features/class/styles/home-classes';
import { useHorizontalScroller } from '@/hooks/useHorizontalScroller';
import { cn } from '@/lib/cn';
import { ClosingSoonCard, ClosingSoonCardSkeleton } from './ClosingSoonCard';
import { CLOSING_SOON_ERROR_MESSAGE } from '@/features/session/constants/messages';
import { closingSoonQuery } from '@/features/session/api/queries';

/**
 * 이번 주 마감 임박 (가로 스크롤 카드). 0개면 섹션을 그리지 않는다.
 * 카드 링크로 Tab 이동하면 브라우저가 알아서 스크롤한다. 48rem 이상에서는 ‹ › 버튼을 보조로 둔다.
 */
export function ClosingSoonSection({ category }: { category?: ClassCategory }) {
  const { data, status, refetch, isFetching } = useQuery(closingSoonQuery(category));
  const { ref: listRef, scrollPrev, scrollNext } = useHorizontalScroller<HTMLUListElement>();
  const titleId = useId();
  const listId = useId();

  if (status === 'success' && data.items.length === 0) return null;

  return (
    <section className={sectionClass} aria-labelledby={titleId}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={titleId} className={sectionTitleClass}>
          이번 주 마감 임박
        </h2>
        {status === 'success' && data.items.length > 1 && (
          <div className="hidden gap-2 md:flex">
            <IconButton
              variant="outline"
              shape="round"
              aria-label="이전 마감 임박 클래스"
              aria-controls={listId}
              onClick={scrollPrev}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              variant="outline"
              shape="round"
              aria-label="다음 마감 임박 클래스"
              aria-controls={listId}
              onClick={scrollNext}
            >
              <ChevronRightIcon />
            </IconButton>
          </div>
        )}
      </div>

      {status === 'error' ? (
        <Alert
          tone="danger"
          live="assertive"
          title={CLOSING_SOON_ERROR_MESSAGE}
          action={
            <Button
              variant="secondary"
              size="sm"
              aria-busy={isFetching || undefined}
              onClick={() => !isFetching && refetch()}
            >
              다시 시도
            </Button>
          }
        />
      ) : (
        <ul
          ref={listRef}
          id={listId}
          className={cn(scrollerClass, '*:flex *:w-55 *:*:flex-1 *:flex-none *:snap-start')}
          aria-labelledby={titleId}
          aria-busy={status === 'pending'}
        >
          {status === 'pending'
            ? Array.from({ length: 3 }, (_, i) => (
                <li key={i} aria-hidden="true">
                  <ClosingSoonCardSkeleton />
                </li>
              ))
            : data.items.map((item) => (
                <li key={item.sessionId}>
                  <ClosingSoonCard item={item} />
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}
