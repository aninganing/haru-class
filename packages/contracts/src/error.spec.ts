import { describe, expect, it } from 'vitest';
import { apiErrorSchema } from './error';

describe('apiErrorSchema', () => {
  it('Nest 기본 예외 응답을 파싱한다', () => {
    const body = { statusCode: 404, message: 'Cannot GET /nope', error: 'Not Found' };
    expect(apiErrorSchema.parse(body)).toEqual(body);
  });

  it('검증 실패처럼 message가 배열이어도 파싱한다', () => {
    const body = { statusCode: 400, message: ['headcount must be ≤ 4'] };
    expect(apiErrorSchema.safeParse(body).success).toBe(true);
  });

  it('statusCode가 없으면 실패한다', () => {
    expect(apiErrorSchema.safeParse({ message: 'oops' }).success).toBe(false);
  });
});
