'use client';

import { Button } from '@aninganing/react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

// Next 16 error.js는 { error, retry }를 받는다 (reset 아님).
export default function ClassDetailError({ error, retry }: { error: unknown; retry: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    console.error(error);
  }, [error]);
  // 화면이 오류로 바뀐 것을 알 수 있게 제목으로 포커스를 옮긴다
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="flex flex-col items-start gap-3 py-8">
      <h1 ref={headingRef} tabIndex={-1} className="text-500 font-bold focus:outline-hidden">
        클래스를 불러오지 못했어요
      </h1>
      <p className="text-fg-subtle">잠시 후 다시 시도해 주세요.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => retry()}>
          다시 시도
        </Button>
        <Link href="/">클래스 목록으로 가기</Link>
      </div>
    </section>
  );
}
