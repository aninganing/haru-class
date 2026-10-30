import type { ClassDetail } from '@haru/contracts';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { focusRingClass } from '@/features/class/styles/detail-classes';
import { formatPrice } from '@/features/class/utils/format';
import { sessionsHref } from '@/features/class/utils/upcoming';

/**
 * 회차 선택 CTA. 64rem 미만에서는 화면 아래 고정 바(가격 + 버튼), 이상에서는 예약 카드 안의 버튼이 된다.
 * 예약 가능한 회차가 없으면 링크 대신 이유를 글로 보여준다.
 * data-cta-bar: html의 scroll-padding이 이 바를 피하도록 참조한다 (WCAG 2.4.11).
 */
export function BookingCta({ detail }: { detail: Pick<ClassDetail, 'id' | 'price' | 'sessions'> }) {
  const bookable = detail.sessions.some((s) => s.status === 'OPEN' && s.remaining > 0);

  return (
    <div
      data-cta-bar=""
      className="fixed inset-x-0 bottom-0 z-10 flex items-center gap-3 border-t border-line bg-surface px-5 pt-3 pb-safe-5 lg:static lg:border-0 lg:p-0"
    >
      {/* 요약에 같은 가격이 있으므로 스크린 리더에는 숨긴다 */}
      <div className="grid lg:hidden" aria-hidden="true">
        <span className="text-50 text-fg-subtle">1인</span>
        <span className="text-300 font-bold tabular-nums">{formatPrice(detail.price)}</span>
      </div>
      {bookable ? (
        <Link
          href={sessionsHref(detail.id)}
          className={cn(
            'inline-flex min-h-12 flex-1 items-center justify-center rounded-md bg-brand px-6 text-200 font-semibold text-fg-inverse hover:bg-brand-hover',
            focusRingClass,
          )}
        >
          회차 선택하기
        </Link>
      ) : (
        <p className="flex-1 text-center text-fg-subtle">예정된 회차가 없어요</p>
      )}
    </div>
  );
}
