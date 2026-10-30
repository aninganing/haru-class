'use client';

import { Dialog, Field, IconButton, Input } from '@aninganing/react';
import { useRef } from 'react';
import { ShareIcon } from '@/components/ui/icons';
import { COPY_FAILED_MESSAGE } from '@/features/class/constants/messages';
import { useShareLink } from '@/features/class/hooks/useShareLink';

/**
 * 공유하기 버튼과 복사 실패 창. 공유·복사·토스트·창 상태·포커스 복귀는 useShareLink가 맡는다.
 * 창은 내용이 짧아 화면 폭과 관계없이 center 하나로 쓴다. 열리면 주소 입력칸을 전체 선택한다.
 */
export function ShareButton({ title }: { title: string }) {
  const { share, failedUrl, closeDialog, buttonRef } = useShareLink(title);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <IconButton ref={buttonRef} variant="overlay" shape="round" aria-label="공유하기" onClick={() => void share()}>
        <ShareIcon />
      </IconButton>
      <Dialog
        open={failedUrl !== null}
        onOpenChange={(open) => !open && closeDialog()}
        title="링크 복사하기"
        description={COPY_FAILED_MESSAGE}
        initialFocus={inputRef}
      >
        <Field.Root fullWidth>
          <Field.Label>클래스 주소</Field.Label>
          <Field.Control>
            <Input ref={inputRef} value={failedUrl ?? ''} readOnly onFocus={(e) => e.currentTarget.select()} />
          </Field.Control>
        </Field.Root>
      </Dialog>
    </>
  );
}
