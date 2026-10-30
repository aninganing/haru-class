import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseCurriculum, sanitizeImages, toClassSummary } from './classes.mapper';

describe('parseCurriculum', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('offsetMinutes 오름차순으로 정렬해서 준다', () => {
    const raw = [
      { offsetMinutes: 90, title: '마무리' },
      { offsetMinutes: 0, title: '인사' },
      { offsetMinutes: 30, title: '실습' },
    ];

    expect(parseCurriculum('c1', raw).map((item) => item.title)).toEqual(['인사', '실습', '마무리']);
  });

  it('원본 배열을 바꾸지 않는다', () => {
    const raw = [
      { offsetMinutes: 30, title: 'b' },
      { offsetMinutes: 0, title: 'a' },
    ];

    parseCurriculum('c1', raw);

    expect(raw[0].title).toBe('b');
  });

  it('빈 배열은 빈 배열', () => {
    expect(parseCurriculum('c1', [])).toEqual([]);
  });

  it.each([
    ['배열이 아닌 값', { offsetMinutes: 0, title: 'x' }],
    ['필드가 빠진 항목', [{ title: '인사' }]],
    ['음수 offset', [{ offsetMinutes: -5, title: '인사' }]],
    ['문자열 offset', [{ offsetMinutes: '0', title: '인사' }]],
    ['null', null],
  ])('%s이면 상세를 깨뜨리지 않고 경고 로그 후 빈 배열', (_, raw) => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    expect(parseCurriculum('class-1', raw)).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('class-1');
  });
});

describe('sanitizeImages', () => {
  const A = 'https://picsum.photos/seed/a/960/640';
  const B = 'https://picsum.photos/seed/b/960/640';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('모두 URL이면 순서 그대로, 경고 없음', () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    expect(sanitizeImages('c1', [A, B])).toEqual([A, B]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('일부만 틀리면 틀린 것만 빼고 순서를 유지하며 경고 한 번', () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    expect(sanitizeImages('class-9', ['not a url', A, '', '/relative.jpg', B])).toEqual([A, B]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('class-9');
  });

  it('모두 틀리면 빈 배열', () => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    expect(sanitizeImages('c1', ['nope', ''])).toEqual([]);
  });

  it('thumbnailUrl은 첫 번째 유효 URL, 유효한 게 없으면 null', () => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const now = new Date('2026-10-28T00:00:00.000Z');
    const row = {
      id: 'c1',
      title: 't',
      summary: 's',
      category: 'CRAFT' as const,
      tags: [],
      neighborhood: '성수동',
      price: 1000,
      durationMinutes: 60,
      createdAt: now,
    };

    expect(toClassSummary({ ...row, images: ['broken', B, A] }, undefined, now).thumbnailUrl).toBe(B);
    expect(toClassSummary({ ...row, images: ['broken'] }, undefined, now).thumbnailUrl).toBeNull();
  });
});
