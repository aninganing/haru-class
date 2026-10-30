import type { SessionSummary } from '@haru/contracts';
import { seatsBadge } from './seats';

/** 상세에서 미리 보여 주는 다가오는 회차 수 */
export const UPCOMING_LIMIT = 3;

/** 회차 선택 화면 주소. sessionId를 주면 그 회차를 미리 고르게 한다. */
export const sessionsHref = (classId: string, sessionId?: string) =>
  `/classes/${classId}/sessions${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`;

/**
 * 보여 줄 회차: 앞 UPCOMING_LIMIT개 + (그 밖에 있으면) 선택한 회차를 뒤에 붙인다 (T11).
 * 선택한 회차가 목록에 없거나 마감(매진·잔여 0)이면 무시하고 selectedId는 undefined.
 */
export function pickShown(sessions: SessionSummary[], selectedSessionId?: string) {
  const shown = sessions.slice(0, UPCOMING_LIMIT);
  const selected = sessions.find((s) => s.id === selectedSessionId);
  const selectable = selected && seatsBadge(selected).label !== '마감' ? selected : undefined;
  if (selectable && !shown.includes(selectable)) shown.push(selectable);
  return { shown, selectedId: selectable?.id };
}
