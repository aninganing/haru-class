import {
  CLOSING_SOON_MAX_RATIO,
  CLOSING_SOON_MAX_REMAINING,
  type SessionSummaryStatus,
} from '@haru/contracts';

/** 마감 임박 기준(closing-soon과 같은 규칙): 잔여 2석 이하 또는 정원의 30% 이하 */
export const isAlmostFull = (remaining: number, capacity: number) =>
  remaining <= CLOSING_SOON_MAX_REMAINING || remaining <= capacity * CLOSING_SOON_MAX_RATIO;

/** 잔여석 배지의 문구와 tone. 색만으로 구분하지 않도록 항상 글자를 함께 쓴다. */
export function seatsBadge(session: { remaining: number; capacity: number; status: SessionSummaryStatus }) {
  if (session.status === 'SOLD_OUT' || session.remaining === 0) return { label: '마감', tone: 'neutral' } as const;
  return {
    label: `잔여 ${session.remaining}석`,
    tone: isAlmostFull(session.remaining, session.capacity) ? 'danger' : 'neutral',
  } as const;
}
