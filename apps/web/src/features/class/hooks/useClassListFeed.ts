'use client';

import type { ClassCategory } from '@haru/contracts';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { classListInfiniteQuery } from '@/features/class/api/queries';
import { LOAD_ERROR_MESSAGE, STALE_CURSOR_MESSAGE } from '@/features/class/constants/messages';
import { uniqueById } from '@/features/class/utils/uniqueById';
import { ApiError } from '@/lib/api/error';
import { keys } from '@/lib/query/keys';

/** 다음 페이지를 무엇이 불렀는지. 포커스 이동·안내 문구가 이 값으로 갈린다. */
export type LoadTrigger = 'auto' | 'button';

/** 400(잘못된 cursor 등)은 같은 cursor로 다시 요청해도 실패하므로 처음부터 다시 불러온다. */
export const isStaleCursorError = (error: unknown) => error instanceof ApiError && error.status === 400;

export interface FooterButton {
  label: '더 보기' | '다시 시도';
  busy: boolean;
  onClick: () => void;
}

/**
 * 새로 열린 클래스 목록의 상태와 동작 (무한 쿼리).
 * - items: 페이지를 이어 붙이고 중복 id를 뺀 목록
 * - 상태 판정: fetchNextPage가 실패해도 status는 'error'가 되고 data는 남으므로 "첫 페이지 실패"는 data 유무로 가른다
 * - loadMore: 중복 요청 방지(요청 중이면 무시, cancelRefetch: false)
 * - retry: 첫 페이지 실패 → refetch, 400 → 이 카테고리 목록만 처음부터(reset), 그 외 → 같은 cursor로 다시
 * - footerButton: 목록 아래 버튼 한 자리 모델. 상태가 바뀌어도 같은 요소에 포커스가 남게 한 자리만 쓴다
 */
export function useClassListFeed(category?: ClassCategory) {
  const queryClient = useQueryClient();
  const {
    data,
    status,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery(classListInfiniteQuery(category));
  const [trigger, setTrigger] = useState<LoadTrigger>('auto');

  const pages = data?.pages ?? [];
  const items = uniqueById(pages.flatMap((page) => page.items));
  const hasData = data !== undefined;
  const isInitialLoading = status === 'pending';
  const isInitialError = status === 'error' && !hasData;
  const isEnd = hasData && !hasNextPage && !isFetchNextPageError;
  const isEmpty = hasData && items.length === 0;
  const canAutoLoad = hasData && hasNextPage && !isFetchingNextPage && !isFetchNextPageError;
  const nextErrorMessage = isFetchNextPageError
    ? isStaleCursorError(error)
      ? STALE_CURSOR_MESSAGE
      : LOAD_ERROR_MESSAGE
    : null;

  const loadMore = (source: LoadTrigger) => {
    if (!hasNextPage || isFetchingNextPage) return;
    setTrigger(source);
    // 기본값(cancelRefetch: true)은 진행 중인 요청을 취소하고 다시 보낸다. 중복 요청을 막기 위해 끈다.
    void fetchNextPage({ cancelRefetch: false });
  };

  const retry = () => {
    if (isFetching) return;
    setTrigger('button');
    if (isInitialError) {
      void refetch();
    } else if (isStaleCursorError(error)) {
      void queryClient.resetQueries({ queryKey: keys.class.list(category), exact: true });
    } else {
      void fetchNextPage({ cancelRefetch: false });
    }
  };

  // DS Button의 isLoading은 disabled를 걸어 포커스를 잃게 하므로 busy(aria-busy)만 주고 중복 클릭은 loadMore에서 막는다.
  // 첫 페이지 실패의 "다시 시도"는 Alert의 action에 있으므로 여기서는 다음 페이지 실패만 다룬다.
  let footerButton: FooterButton | null = null;
  if (isFetchNextPageError) {
    footerButton = { label: '다시 시도', busy: isFetching, onClick: retry };
  } else if (isInitialLoading) {
    footerButton = { label: '더 보기', busy: true, onClick: () => {} };
  } else if (hasNextPage) {
    footerButton = { label: '더 보기', busy: isFetchingNextPage, onClick: () => loadMore('button') };
  }

  return {
    items,
    pageCount: pages.length,
    trigger,
    isInitialLoading,
    isInitialError,
    isEmpty,
    isEnd,
    isFetching,
    isFetchingNextPage,
    canAutoLoad,
    nextErrorMessage,
    loadMore,
    retry,
    footerButton,
  };
}
