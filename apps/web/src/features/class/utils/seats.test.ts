import { describe, expect, it } from 'vitest';
import { isAlmostFull, seatsBadge } from './seats';

describe('isAlmostFull', () => {
  it('잔여 2석 이하는 마감 임박이다', () => {
    // 정원 9명: 30%는 2.7석이라 3석은 비율 기준에도 걸리지 않는다
    expect(isAlmostFull(2, 9)).toBe(true);
    expect(isAlmostFull(1, 9)).toBe(true);
    expect(isAlmostFull(3, 9)).toBe(false);
  });

  it('잔여석이 정원의 30% 이하이면 마감 임박이다', () => {
    expect(isAlmostFull(3, 10)).toBe(true); // 30%
    expect(isAlmostFull(4, 10)).toBe(false); // 40%
    expect(isAlmostFull(4, 6)).toBe(false); // 시안: 정원 6명 잔여 4석은 neutral
  });
});

describe('seatsBadge', () => {
  it('마감 임박이면 danger, 아니면 neutral, 매진이면 neutral "마감"', () => {
    expect(seatsBadge({ remaining: 1, capacity: 6, status: 'OPEN' })).toEqual({ label: '잔여 1석', tone: 'danger' });
    expect(seatsBadge({ remaining: 4, capacity: 6, status: 'OPEN' })).toEqual({ label: '잔여 4석', tone: 'neutral' });
    expect(seatsBadge({ remaining: 0, capacity: 6, status: 'SOLD_OUT' })).toEqual({ label: '마감', tone: 'neutral' });
  });
});
