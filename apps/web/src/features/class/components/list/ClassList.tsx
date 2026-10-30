'use client';

import { Alert, Badge, Button, Spinner } from '@aninganing/react';
import type { ClassCategory } from '@haru/contracts';
import { LOAD_ERROR_MESSAGE } from '@/features/class/constants/messages';
import { useClassListFeed } from '@/features/class/hooks/useClassListFeed';
import { useLoadMoreAnnouncement } from '@/features/class/hooks/useLoadMoreAnnouncement';
import { classListClass, sectionClass, sectionTitleClass } from '@/features/class/styles/home-classes';
import { useAutoLoad } from '@/hooks/useAutoLoad';
import { ClassListItem } from './ClassListItem';
import { ClassListItemSkeleton } from './ClassListItemSkeleton';

const INITIAL_SKELETONS = 4;
const MORE_SKELETONS = 3;
/** 목록 끝이 화면에 닿기 전에 미리 불러오는 거리 */
const AUTO_LOAD_MARGIN = '0px 0px 200px 0px';

interface ClassListProps {
  /** 카테고리 필터 (없으면 전체). 바뀌면 부모가 key로 다시 마운트한다. */
  category?: ClassCategory;
}

/**
 * 새로 열린 클래스 목록 (최신순, 무한 스크롤 + "더 보기" 버튼).
 * 상태·동작은 useClassListFeed, 안내·포커스는 useLoadMoreAnnouncement, 목록 끝 감지는 useAutoLoad가 맡는다.
 * - 목록 끝 sentinel이 보이면 자동으로 다음 페이지를 불러온다. 버튼은 키보드·스크린 리더·observer 미지원 대비로 항상 둔다.
 * - 다음 페이지 요청이 실패하면 자동 로드를 멈추고 "다시 시도"를 보여준다.
 */
export function ClassList({ category }: ClassListProps) {
  const feed = useClassListFeed(category);
  const { announcement, listRef, endRef } = useLoadMoreAnnouncement({
    pageCount: feed.pageCount,
    itemCount: feed.items.length,
    isEnd: feed.isEnd,
    trigger: feed.trigger,
  });
  const sentinelRef = useAutoLoad<HTMLDivElement>({
    enabled: feed.canAutoLoad,
    onLoad: () => feed.loadMore('auto'),
    rootMargin: AUTO_LOAD_MARGIN,
    resetKey: feed.pageCount,
  });
  const button = feed.footerButton;

  return (
    <section className={sectionClass} aria-labelledby="new-classes-title">
      <h2 id="new-classes-title" className={sectionTitleClass}>
        새로 열린 클래스
      </h2>
      {feed.isInitialError ? (
        // 첫 화면에서 목록 대신 나타나는 오류라 바로 알린다 (live="assertive" → role="alert")
        <Alert
          className="mt-6"
          tone="danger"
          live="assertive"
          title={LOAD_ERROR_MESSAGE}
          action={
            <Button size="sm" variant="secondary" aria-busy={feed.isFetching || undefined} onClick={feed.retry}>
              다시 시도
            </Button>
          }
        />
      ) : feed.isEmpty ? (
        <p className="mt-6 flex flex-col items-center gap-3 text-fg-subtle">아직 열린 클래스가 없어요</p>
      ) : (
        <ul
          ref={listRef}
          className={classListClass}
          aria-busy={feed.isInitialLoading || feed.isFetchingNextPage}
          aria-labelledby="new-classes-title"
        >
          {feed.items.map((item) => (
            <li key={item.id}>
              <ClassListItem item={item} />
            </li>
          ))}
          {(feed.isInitialLoading || feed.isFetchingNextPage) &&
            Array.from({ length: feed.isInitialLoading ? INITIAL_SKELETONS : MORE_SKELETONS }, (_, i) => (
              <li key={`skeleton-${i}`} aria-hidden="true">
                <ClassListItemSkeleton />
              </li>
            ))}
        </ul>
      )}

      {feed.canAutoLoad && <div ref={sentinelRef} className="h-px" aria-hidden="true" />}

      <div className="mt-6 flex flex-col items-center gap-3">
        <p role="status" className="sr-only">
          {feed.nextErrorMessage ?? announcement}
        </p>
        {feed.nextErrorMessage && <Badge tone="danger">{feed.nextErrorMessage}</Badge>}
        {feed.isEnd && feed.items.length > 0 && (
          <p ref={endRef} tabIndex={-1} className="text-100 text-fg-subtle">
            모든 클래스를 다 봤어요
          </p>
        )}
        {button && (
          // 버튼은 항상 이 자리의 첫 요소라 상태가 바뀌어도 같은 요소에 포커스가 남는다.
          // 로딩 중에는 disabled 대신 aria-busy + Spinner(300ms 뒤에 보임 — 빠른 응답은 깜빡이지 않게)
          <div className="flex items-center gap-2">
            <Button variant="secondary" aria-busy={button.busy || undefined} onClick={button.onClick}>
              {button.label}
            </Button>
            {button.busy && <Spinner size="sm" label="클래스를 불러오는 중" />}
          </div>
        )}
      </div>
    </section>
  );
}
