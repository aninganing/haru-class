import { Badge } from '@aninganing/react';
import type { SessionSummary } from '@haru/contracts';
import Link from 'next/link';
import { ChevronRightIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { focusRingClass, sectionTitleClass } from '@/features/class/styles/detail-classes';
import { formatSessionDate, formatSessionTimeRange } from '@/features/class/utils/format';
import { seatsBadge } from '@/features/class/utils/seats';
import { pickShown, sessionsHref } from '@/features/class/utils/upcoming';

const rowClass = 'flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-4 text-fg';

interface UpcomingSessionsProps {
  classId: string;
  sessions: SessionSummary[];
  /** 마감 임박 카드에서 고른 회차(?sessionId=). 예약 가능한 회차일 때만 반영한다. */
  selectedSessionId?: string;
}

/**
 * 다가오는 회차 (최대 3개). 예약 가능한 행은 회차 선택 화면으로 가는 링크, 마감 행은 링크가 아니다.
 * 링크 여부는 배지와 같은 조건(매진이거나 잔여 0이면 "마감")으로 정한다 — 마감 행이 링크로 남지 않게 (WCAG 2.4.4).
 */
export function UpcomingSessions({ classId, sessions, selectedSessionId }: UpcomingSessionsProps) {
  const { shown, selectedId } = pickShown(sessions, selectedSessionId);

  return (
    <section aria-labelledby="upcoming-sessions-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="upcoming-sessions-title" className={sectionTitleClass}>
          다가오는 회차
        </h2>
        {sessions.length > 0 && (
          <Link href={sessionsHref(classId)} className={cn('text-100 text-fg-subtle hover:underline', focusRingClass)}>
            전체 일정
          </Link>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="text-fg-subtle">예정된 회차가 없어요</p>
      ) : (
        <ul>
          {shown.map((session) => {
            const badge = seatsBadge(session);
            const soldOut = badge.label === '마감';
            const isSelected = session.id === selectedId;
            const content = (
              <>
                <span className="min-w-22 text-200 font-semibold tabular-nums">
                  {formatSessionDate(session.startsAt)}
                </span>
                {/* 선택한 회차 행(bg-brand-subtle) 위의 보조 글자는 그 면에 맞춘 색으로 대비를 지킨다 */}
                <span
                  className={cn('text-100 tabular-nums', isSelected ? 'text-fg-on-brand-subtle' : 'text-fg-subtle')}
                >
                  {formatSessionTimeRange(session.startsAt, session.endsAt)}
                </span>
                {/* 선택한 회차는 글자로도 표시한다 (색만으로 구분하지 않음) */}
                {isSelected && (
                  <Badge tone="accent" size="sm">
                    선택한 회차
                  </Badge>
                )}
                <span
                  className={cn(
                    'ml-auto flex items-center gap-2',
                    isSelected ? 'text-fg-on-brand-subtle' : 'text-fg-subtle',
                  )}
                >
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                  {!soldOut && <ChevronRightIcon size={16} />}
                </span>
              </>
            );
            return (
              <li key={session.id}>
                {soldOut ? (
                  <div className={rowClass}>{content}</div>
                ) : (
                  <Link
                    href={sessionsHref(classId, session.id)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={cn(rowClass, focusRingClass, isSelected && '-mx-3 rounded-md bg-brand-subtle px-3')}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
