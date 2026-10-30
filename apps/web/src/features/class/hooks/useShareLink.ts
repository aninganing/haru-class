'use client';

import { toast } from '@aninganing/react';
import { useRef, useState } from 'react';
import { COPIED_MESSAGE } from '@/features/class/constants/messages';
import { canNativeShare, isShareAbort } from '@/features/class/utils/share';

/**
 * 현재 페이지 공유.
 * - share(): 모바일은 navigator.share. 취소(AbortError)면 끝, 그 밖의 실패는 링크 복사로 넘어간다
 * - 링크 복사: clipboard.writeText → toast "링크를 복사했어요" (매번 새 토스트라 여러 번 복사해도 매번 읽힌다)
 * - 복사도 실패하면 failedUrl에 주소를 담는다 → 컴포넌트가 Dialog로 보여준다
 * - closeDialog(): DS Dialog를 trigger 없이 open으로 열면 닫힐 때 포커스가 body로 빠진다 (DS 0.5.0, 문서와 다름).
 *   닫은 뒤 buttonRef(공유 버튼)로 직접 돌려준다
 */
export function useShareLink(title: string) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const closeDialog = () => {
    setFailedUrl(null);
    setTimeout(() => buttonRef.current?.focus(), 0);
  };

  const copy = async (url: string) => {
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(url);
      toast({ message: COPIED_MESSAGE });
    } catch {
      setFailedUrl(url);
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (canNativeShare()) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (isShareAbort(error)) return;
      }
    }
    await copy(url);
  };

  return { share, failedUrl, closeDialog, buttonRef };
}
