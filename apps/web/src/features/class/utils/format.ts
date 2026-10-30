/**
 * 화면 표시용 포맷 (시안 기준: 24시간제, "10/31(토) 14:00").
 * 시각은 항상 Asia/Seoul로 보여준다. Intl 결과 문자열을 그대로 쓰지 않고 formatToParts 조각을 직접 조립한다 —
 * Node와 브라우저의 ICU 버전 차이로 공백·구두점이 달라지면 hydration mismatch가 나기 때문이다.
 */

const TIME_ZONE = 'Asia/Seoul';

const numberFormat = new Intl.NumberFormat('ko-KR');

/** 35000 → "35,000원", 0 → "무료" */
export function formatPrice(price: number) {
  return price === 0 ? '무료' : `${numberFormat.format(price)}원`;
}

/** 30분 단위는 소수 시간("1.5시간", "2시간"), 그 밖에는 "1시간 15분", 1시간 미만은 "45분" */
export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}분`;
  if (minutes % 30 === 0) return `${minutes / 60}시간`;
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`;
}

/** 커리큘럼 시작 기준 분 → "0:20", "1:20" */
export function formatOffset(offsetMinutes: number) {
  return `${Math.floor(offsetMinutes / 60)}:${String(offsetMinutes % 60).padStart(2, '0')}`;
}

const partsFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h23',
});

interface SeoulParts {
  year: number;
  month: number;
  day: number;
  weekday: string;
  /** "14:00" */
  time: string;
}

function toSeoulParts(date: Date): SeoulParts {
  const parts = partsFormat.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const hour = String(Number(get('hour')) % 24).padStart(2, '0');
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: get('weekday'),
    time: `${hour}:${get('minute').padStart(2, '0')}`,
  };
}

const sameDate = (a: SeoulParts, b: SeoulParts) => a.year === b.year && a.month === b.month && a.day === b.day;

const dateText = (p: SeoulParts, now: SeoulParts) =>
  `${p.year !== now.year ? `${p.year}/` : ''}${p.month}/${p.day}(${p.weekday})`;

/** "10/31(토)". 서울 기준으로 올해가 아니면 "2027/1/2(토)" */
export function formatSessionDate(iso: string, now: Date = new Date()) {
  return dateText(toSeoulParts(new Date(iso)), toSeoulParts(now));
}

/** "10/31(토) 14:00" */
export function formatShortDateTime(iso: string, now: Date = new Date()) {
  const p = toSeoulParts(new Date(iso));
  return `${dateText(p, toSeoulParts(now))} ${p.time}`;
}

/** "14:00 – 16:00". 서울 날짜가 바뀌면 "23:00 – 다음 날 01:00" */
export function formatSessionTimeRange(startsAt: string, endsAt: string) {
  const start = toSeoulParts(new Date(startsAt));
  const end = toSeoulParts(new Date(endsAt));
  return `${start.time} – ${sameDate(start, end) ? '' : '다음 날 '}${end.time}`;
}
