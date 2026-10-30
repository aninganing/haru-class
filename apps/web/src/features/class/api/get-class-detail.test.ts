import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/error';
import { json, mockFetch } from '@/test/mock-fetch';
import { makeClassDetail } from '@/features/class/fixtures/classes';
import { getClassDetail } from './get-class-detail';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

const VALID_ID = 'ckz8x1x0p0000qzrmn831i7rn';

describe('getClassDetail', () => {
  let restore = () => {};
  let calls: string[] = [];
  afterEach(() => restore());
  beforeEach(() => {
    calls = [];
  });

  it('클래스 상세를 불러온다', async () => {
    const detail = makeClassDetail({ id: VALID_ID });
    restore = mockFetch((url) => {
      calls.push(url);
      return json(detail);
    });

    await expect(getClassDetail(VALID_ID)).resolves.toEqual(detail);
    expect(calls).toEqual([`/api/classes/${VALID_ID}`]);
  });

  it('id 형식이 틀리면 요청하지 않고 404 화면으로 보낸다', async () => {
    restore = mockFetch((url) => {
      calls.push(url);
      return json(makeClassDetail());
    });

    await expect(getClassDetail('not a cuid!')).rejects.toThrow('NEXT_NOT_FOUND');
    expect(calls).toEqual([]);
  });

  it('API가 404를 주면 404 화면으로 보낸다', async () => {
    restore = mockFetch(() => json({ statusCode: 404, message: 'Not Found', error: 'Not Found' }, 404));

    await expect(getClassDetail(VALID_ID)).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('API가 400을 주면 404 화면으로 보낸다', async () => {
    restore = mockFetch(() => json({ statusCode: 400, message: 'Validation failed', error: 'Bad Request' }, 400));

    await expect(getClassDetail(VALID_ID)).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('서버 오류(500)는 그대로 던져 error.tsx가 보여주게 한다', async () => {
    restore = mockFetch(() => json({ statusCode: 500, message: 'Internal server error' }, 500));

    const result = getClassDetail(VALID_ID);
    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({ status: 500 });
  });

  it('네트워크 오류는 404로 바꾸지 않고 그대로 던진다', async () => {
    const { notFound } = await import('next/navigation');
    vi.mocked(notFound).mockClear();
    restore = mockFetch(() => Promise.reject(new TypeError('fetch failed')));

    const result = getClassDetail(VALID_ID);
    await expect(result).rejects.toBeInstanceOf(TypeError);
    await expect(result).rejects.toThrow('fetch failed');
    expect(notFound).not.toHaveBeenCalled();
  });
});
