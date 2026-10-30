import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  formatOffset,
  formatPrice,
  formatSessionDate,
  formatSessionTimeRange,
  formatShortDateTime,
} from './format';

const NOW = new Date('2026-10-27T00:00:00.000Z');

describe('formatPrice', () => {
  it('원 단위에 천 단위 구분 기호를 붙이고 0원은 "무료"로 보여준다', () => {
    expect(formatPrice(45000)).toBe('45,000원');
    expect(formatPrice(1234567)).toBe('1,234,567원');
    expect(formatPrice(0)).toBe('무료');
  });
});

describe('formatDuration', () => {
  it('30분 단위는 소수 시간으로 보여준다 (시안: "1.5시간")', () => {
    expect(formatDuration(60)).toBe('1시간');
    expect(formatDuration(90)).toBe('1.5시간');
    expect(formatDuration(150)).toBe('2.5시간');
    expect(formatDuration(180)).toBe('3시간');
  });

  it('30분 단위가 아니면 "시간 분", 1시간 미만은 "분"으로 보여준다', () => {
    expect(formatDuration(75)).toBe('1시간 15분');
    expect(formatDuration(45)).toBe('45분');
    expect(formatDuration(30)).toBe('30분');
  });
});

describe('formatOffset', () => {
  it('수업 시작 기준 분을 "시:분"으로 보여준다', () => {
    expect(formatOffset(0)).toBe('0:00');
    expect(formatOffset(20)).toBe('0:20');
    expect(formatOffset(80)).toBe('1:20');
    expect(formatOffset(125)).toBe('2:05');
  });
});

describe('formatShortDateTime / formatSessionDate', () => {
  it('UTC 시각을 서울 시각 24시간제로 보여준다', () => {
    expect(formatShortDateTime('2026-10-31T05:00:00.000Z', NOW)).toBe('10/31(토) 14:00');
    expect(formatShortDateTime('2026-11-01T00:05:00.000Z', NOW)).toBe('11/1(일) 09:05');
    expect(formatSessionDate('2026-10-31T05:00:00.000Z', NOW)).toBe('10/31(토)');
  });

  it('서울 자정 직전과 자정은 날짜가 갈린다 (UTC 15:00 경계)', () => {
    expect(formatShortDateTime('2026-11-03T14:59:00.000Z', NOW)).toBe('11/3(화) 23:59');
    expect(formatShortDateTime('2026-11-03T15:00:00.000Z', NOW)).toBe('11/4(수) 00:00');
  });

  it('서울 기준으로 올해가 아니면 연도를 붙인다', () => {
    // UTC로는 12월 31일이지만 서울로는 다음 해 1월 1일
    expect(formatShortDateTime('2026-12-31T15:30:00.000Z', NOW)).toBe('2027/1/1(금) 00:30');
    expect(formatSessionDate('2026-12-31T14:30:00.000Z', NOW)).toBe('12/31(목)');
  });
});

describe('연도 경계 (now 쪽)', () => {
  it('서울로 이미 새해면(now가 UTC 12/31 15:00 이후) 같은 해 회차에 연도를 붙이지 않는다', () => {
    const seoulNewYear = new Date('2026-12-31T15:30:00.000Z'); // 서울 2027-01-01 00:30
    expect(formatShortDateTime('2027-01-05T05:00:00.000Z', seoulNewYear)).toBe('1/5(화) 14:00');
    expect(formatSessionDate('2027-01-05T05:00:00.000Z', seoulNewYear)).toBe('1/5(화)');
    // 서울 기준 지난해(2026) 회차에는 연도를 붙인다
    expect(formatSessionDate('2026-12-31T05:00:00.000Z', seoulNewYear)).toBe('2026/12/31(목)');
  });

  it('UTC로는 아직 12/31이어도 서울 기준 같은 해면 연도를 붙이지 않는다', () => {
    const utcNewYearsEve = new Date('2026-12-31T14:59:00.000Z'); // 서울 2026-12-31 23:59
    expect(formatSessionDate('2026-12-31T14:30:00.000Z', utcNewYearsEve)).toBe('12/31(목)');
    expect(formatSessionDate('2026-12-31T15:00:00.000Z', utcNewYearsEve)).toBe('2027/1/1(금)');
  });
});

describe('formatSessionTimeRange', () => {
  it('같은 날이면 "14:00 – 16:00"', () => {
    expect(formatSessionTimeRange('2026-10-31T05:00:00.000Z', '2026-10-31T07:00:00.000Z')).toBe('14:00 – 16:00');
  });

  it('서울 자정을 넘으면 끝 시각에 "다음 날"을 붙인다', () => {
    expect(formatSessionTimeRange('2026-11-03T14:00:00.000Z', '2026-11-03T16:00:00.000Z')).toBe(
      '23:00 – 다음 날 01:00',
    );
  });

  it('UTC 날짜만 바뀌고 서울 날짜가 같으면 "다음 날"을 붙이지 않는다', () => {
    expect(formatSessionTimeRange('2026-11-03T23:00:00.000Z', '2026-11-04T01:00:00.000Z')).toBe('08:00 – 10:00');
  });

  it('서울 12/31 밤에 시작해 1/1 새벽에 끝나는 회차는 "다음 날"을 붙인다', () => {
    expect(formatSessionTimeRange('2026-12-31T14:00:00.000Z', '2026-12-31T16:00:00.000Z')).toBe(
      '23:00 – 다음 날 01:00',
    );
  });
});
