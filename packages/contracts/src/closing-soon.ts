import { z } from 'zod';
import { classCategorySchema } from './class';

/** 이 기간 안에 시작하는 회차만 '마감 임박' 후보로 본다 */
export const CLOSING_SOON_WINDOW_DAYS = 7;
/** 잔여석이 이 수 이하이면 마감 임박 */
export const CLOSING_SOON_MAX_REMAINING = 2;
/** 또는 잔여석이 정원의 이 비율 이하이면 마감 임박 */
export const CLOSING_SOON_MAX_RATIO = 0.3;
export const CLOSING_SOON_DEFAULT_LIMIT = 10;
export const CLOSING_SOON_MAX_LIMIT = 20;

export const closingSoonQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(CLOSING_SOON_MAX_LIMIT).default(CLOSING_SOON_DEFAULT_LIMIT),
  /** 홈의 카테고리 칩과 같은 필터. 없으면 전체 */
  category: classCategorySchema.optional(),
});
export type ClosingSoonQuery = z.infer<typeof closingSoonQuerySchema>;

/**
 * 마감 임박 회차 하나 (회차 단위 카드).
 * 조건: OPEN, 지금 이후 CLOSING_SOON_WINDOW_DAYS일 안에 시작, 0 < remaining,
 * remaining <= CLOSING_SOON_MAX_REMAINING 또는 remaining <= capacity * CLOSING_SOON_MAX_RATIO.
 * 클래스당 가장 이른 회차 1건만 준다 (한 클래스가 목록을 다 차지하지 않게).
 * 정렬: startsAt 오름차순, 동률이면 sessionId 오름차순.
 */
export const closingSoonItemSchema = z.object({
  sessionId: z.string(),
  startsAt: z.iso.datetime(),
  capacity: z.number().int().positive(),
  remaining: z.number().int().positive(),
  class: z.object({
    id: z.string(),
    title: z.string(),
    category: classCategorySchema,
    neighborhood: z.string(),
    price: z.number().int().nonnegative(),
    durationMinutes: z.number().int().positive(),
    thumbnailUrl: z.url().nullable(),
  }),
});
export type ClosingSoonItem = z.infer<typeof closingSoonItemSchema>;

export const closingSoonResponseSchema = z.object({
  items: z.array(closingSoonItemSchema),
});
export type ClosingSoonResponse = z.infer<typeof closingSoonResponseSchema>;
