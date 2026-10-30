import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { decodeClassCursor, encodeClassCursor, INVALID_CURSOR_MESSAGE } from './class-cursor';

const b64 = (value: string) => Buffer.from(value, 'utf8').toString('base64url');
const ID = 'cmh8q2x0a0000abcd1234efgh';

describe('class cursor', () => {
  it('인코딩한 커서를 디코딩하면 createdAt(ms 포함)과 id가 그대로 나온다', () => {
    const createdAt = new Date('2026-10-27T14:30:00.123Z');
    const decoded = decodeClassCursor(encodeClassCursor({ createdAt, id: ID }));

    expect(decoded.id).toBe(ID);
    expect(decoded.createdAt.toISOString()).toBe('2026-10-27T14:30:00.123Z');
  });

  it('인코딩 결과는 URL에 그대로 넣을 수 있는 문자만 쓴다', () => {
    const cursor = encodeClassCursor({ createdAt: new Date(), id: ID });
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it.each([
    ['base64url이 아닌 문자', 'abc$%^'],
    ['패딩 문자', `${b64('{}')}==`],
    ['JSON이 아닌 내용', b64('not json')],
    ['필드 누락', b64(JSON.stringify({ c: '2026-10-27T00:00:00.000Z' }))],
    ['날짜가 아닌 c', b64(JSON.stringify({ c: 'yesterday', i: ID }))],
    ['cuid가 아닌 i', b64(JSON.stringify({ c: '2026-10-27T00:00:00.000Z', i: 'not a cuid' }))],
    ['배열', b64(JSON.stringify(['2026-10-27T00:00:00.000Z', ID]))],
    ['null', b64('null')],
  ])('%s이면 400과 안내 문구', (_, raw) => {
    expect(() => decodeClassCursor(raw)).toThrow(BadRequestException);
    expect(() => decodeClassCursor(raw)).toThrow(INVALID_CURSOR_MESSAGE);
  });
});
