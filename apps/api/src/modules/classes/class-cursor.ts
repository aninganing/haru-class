import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

/** 목록 커서: 마지막 항목의 (createdAt, id). 서버만 해석하는 불투명 문자열이다. */
export interface ClassCursor {
  createdAt: Date;
  id: string;
}

export const INVALID_CURSOR_MESSAGE = '목록 위치 정보가 올바르지 않아요';

const BASE64URL = /^[A-Za-z0-9_-]+$/;

const payloadSchema = z.object({
  c: z.iso.datetime(),
  i: z.cuid(),
});

export function encodeClassCursor(cursor: ClassCursor): string {
  const payload: z.infer<typeof payloadSchema> = { c: cursor.createdAt.toISOString(), i: cursor.id };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/** 형식이 틀리면 400(BadRequestException). */
export function decodeClassCursor(raw: string): ClassCursor {
  // Buffer의 base64url 디코딩은 틀린 문자를 조용히 무시하므로 먼저 문자 집합을 확인한다.
  if (!BASE64URL.test(raw)) throw new BadRequestException(INVALID_CURSOR_MESSAGE);

  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch {
    throw new BadRequestException(INVALID_CURSOR_MESSAGE);
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) throw new BadRequestException(INVALID_CURSOR_MESSAGE);

  return { createdAt: new Date(parsed.data.c), id: parsed.data.i };
}
