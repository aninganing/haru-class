import { describe, expect, it } from 'vitest';
import { makeSession } from '@/features/class/fixtures/classes';
import { UPCOMING_LIMIT, pickShown, sessionsHref } from './upcoming';

const sessions = Array.from({ length: 5 }, (_, i) => makeSession({ id: `s${i}`, remaining: 5 }));

describe('sessionsHref', () => {
  it('회차 선택 화면 주소를 만들고, sessionId는 인코딩해서 붙인다', () => {
    expect(sessionsHref('c1')).toBe('/classes/c1/sessions');
    expect(sessionsHref('c1', 's1')).toBe('/classes/c1/sessions?sessionId=s1');
    expect(sessionsHref('c1', 'a b&c')).toBe('/classes/c1/sessions?sessionId=a%20b%26c');
  });
});

describe('pickShown', () => {
  it('선택이 없으면 앞 3개만', () => {
    const { shown, selectedId } = pickShown(sessions);
    expect(UPCOMING_LIMIT).toBe(3);
    expect(shown.map((s) => s.id)).toEqual(['s0', 's1', 's2']);
    expect(selectedId).toBeUndefined();
  });

  it('선택한 회차가 앞 3개 밖이면 뒤에 붙이고, 안이면 그대로 둔다', () => {
    expect(pickShown(sessions, 's4').shown.map((s) => s.id)).toEqual(['s0', 's1', 's2', 's4']);
    expect(pickShown(sessions, 's4').selectedId).toBe('s4');
    expect(pickShown(sessions, 's1').shown.map((s) => s.id)).toEqual(['s0', 's1', 's2']);
    expect(pickShown(sessions, 's1').selectedId).toBe('s1');
  });

  it('없는 회차·매진·잔여 0 회차는 무시한다', () => {
    const withClosed = [
      ...sessions,
      makeSession({ id: 'sold', remaining: 0, status: 'SOLD_OUT' }),
      makeSession({ id: 'zero', remaining: 0, status: 'OPEN' }),
    ];
    for (const id of ['nope', 'sold', 'zero']) {
      const { shown, selectedId } = pickShown(withClosed, id);
      expect(shown).toHaveLength(3);
      expect(selectedId).toBeUndefined();
    }
  });

  it('원본 배열을 바꾸지 않는다', () => {
    const copy = [...sessions];
    pickShown(sessions, 's4');
    expect(sessions).toEqual(copy);
  });
});
