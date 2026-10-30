'use client';

import { useEffect, useRef, useState } from 'react';
import type { LoadTrigger } from './useClassListFeed';

interface Options {
  pageCount: number;
  /** 중복을 뺀 뒤 화면에 있는 항목 수 */
  itemCount: number;
  isEnd: boolean;
  trigger: LoadTrigger;
}

/**
 * 다음 페이지를 불러온 뒤의 안내와 포커스.
 * - announcement: "클래스 N개를 더 불러왔어요"(N은 실제로 늘어난 카드 수, 0개면 생략) + 끝이면 "모든 클래스를 다 봤어요"
 *   목록이 처음부터 다시 불러와지면(페이지 수가 줄면) 비운다.
 * - 버튼으로 불러왔고 끝이 아니면 새로 붙은 첫 항목 링크로 포커스 (listRef의 자식 순서 기준)
 * - 버튼으로 끝까지 불러와 버튼이 사라지면 끝 안내 문구(endRef)로 포커스. 그때 status에는 끝 문구를 반복하지 않는다.
 * - 자동 로드(스크롤)는 포커스를 옮기지 않는다.
 */
export function useLoadMoreAnnouncement({ pageCount, itemCount, isEnd, trigger }: Options) {
  const listRef = useRef<HTMLUListElement>(null);
  const endRef = useRef<HTMLParagraphElement>(null);

  // 렌더링 중 이전 값과 비교하는 React 권장 패턴 (effect에서 setState하지 않는다)
  const [seenPageCount, setSeenPageCount] = useState(pageCount);
  const [seenItemCount, setSeenItemCount] = useState(itemCount);
  const [announcement, setAnnouncement] = useState('');
  /** 버튼으로 불러온 뒤 포커스를 옮길 새 첫 항목의 위치 (끝이 아닐 때만) */
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  if (pageCount !== seenPageCount) {
    setSeenPageCount(pageCount);
    setSeenItemCount(itemCount);
    setFocusIndex(null);
    if (pageCount < seenPageCount) {
      setAnnouncement('');
    } else if (seenPageCount > 0) {
      const added = itemCount - seenItemCount;
      const moved = isEnd && trigger === 'button';
      const end = isEnd && !moved ? '모든 클래스를 다 봤어요' : '';
      setAnnouncement(added > 0 ? `클래스 ${added}개를 더 불러왔어요${end ? `. ${end}` : ''}` : end);
      if (trigger === 'button' && added > 0 && !isEnd) setFocusIndex(seenItemCount);
    }
  }

  useEffect(() => {
    if (focusIndex === null) return;
    listRef.current?.children[focusIndex]?.querySelector('a')?.focus();
  }, [focusIndex]);

  useEffect(() => {
    if (isEnd && trigger === 'button' && itemCount > 0) endRef.current?.focus();
  }, [isEnd, trigger, itemCount]);

  return { announcement, listRef, endRef };
}
