import { z } from 'zod';

export const CLASS_LIST_DEFAULT_LIMIT = 20;
export const CLASS_LIST_MAX_LIMIT = 50;
/** 생성 후 이 기간 안이면 '신규 오픈'으로 표시한다 */
export const NEW_CLASS_DAYS = 14;
export const CLASS_MAX_IMAGES = 6;

export const classCategorySchema = z.enum(['CRAFT', 'COOKING', 'DRAWING', 'FLOWER', 'SCENT']);
export type ClassCategory = z.infer<typeof classCategorySchema>;
export const CLASS_CATEGORY_LABELS: Record<ClassCategory, string> = {
  CRAFT: '공예',
  COOKING: '요리·베이킹',
  DRAWING: '드로잉',
  FLOWER: '플라워',
  SCENT: '향·캔들',
};

export const classDifficultySchema = z.enum(['INTRO', 'BEGINNER', 'INTERMEDIATE']);
export type ClassDifficulty = z.infer<typeof classDifficultySchema>;
export const CLASS_DIFFICULTY_LABELS: Record<ClassDifficulty, string> = {
  INTRO: '입문',
  BEGINNER: '초급',
  INTERMEDIATE: '중급',
};

/** 모든 클래스에 같은 규정을 적용한다 (클래스별 규정이 생기면 필드로 옮긴다) */
export const REFUND_POLICY = [
  '클래스 2일 전까지 전액 환불돼요.',
  '1일 전까지는 50% 환불돼요.',
  '당일 취소는 환불되지 않아요.',
] as const;

export const classListQuerySchema = z.object({
  // 서버만 해석하는 불투명 문자열 (createdAt + id)
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(CLASS_LIST_MAX_LIMIT).default(CLASS_LIST_DEFAULT_LIMIT),
  category: classCategorySchema.optional(),
});
export type ClassListQuery = z.infer<typeof classListQuerySchema>;

export const classIdParamSchema = z.object({
  id: z.cuid(),
});

const classBaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  category: classCategorySchema,
  tags: z.array(z.string()),
  /** 동네 이름 (예: 성수동) */
  neighborhood: z.string(),
  /** 원 단위, 1인 기준 */
  price: z.number().int().nonnegative(),
  durationMinutes: z.number().int().positive(),
  /** 대표 이미지 (images의 첫 장). 없으면 null */
  thumbnailUrl: z.url().nullable(),
  /** 예약 가능한 회차 중 가장 큰 정원. 예약 가능한 회차가 없으면 null */
  maxCapacity: z.number().int().positive().nullable(),
});

export const classSummarySchema = classBaseSchema.extend({
  /** 생성 후 NEW_CLASS_DAYS일 이내 */
  isNew: z.boolean(),
  /** 가장 가까운 예약 가능 회차의 시작 시각. 없으면 null */
  nextSessionAt: z.iso.datetime().nullable(),
});
export type ClassSummary = z.infer<typeof classSummarySchema>;

export const classListResponseSchema = z.object({
  items: z.array(classSummarySchema),
  nextCursor: z.string().nullable(),
});
export type ClassListResponse = z.infer<typeof classListResponseSchema>;

// 지난 회차와 CLOSED 회차는 응답에 포함하지 않는다
export const sessionSummaryStatusSchema = z.enum(['OPEN', 'SOLD_OUT']);
export type SessionSummaryStatus = z.infer<typeof sessionSummaryStatusSchema>;

export const sessionSummarySchema = z.object({
  id: z.string(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  capacity: z.number().int().positive(),
  remaining: z.number().int().nonnegative(),
  status: sessionSummaryStatusSchema,
});
export type SessionSummary = z.infer<typeof sessionSummarySchema>;

export const curriculumItemSchema = z.object({
  /** 수업 시작 기준 분 (0 = 시작) */
  offsetMinutes: z.number().int().nonnegative(),
  title: z.string(),
});
export type CurriculumItem = z.infer<typeof curriculumItemSchema>;

export const classDetailSchema = classBaseSchema.extend({
  description: z.string(),
  difficulty: classDifficultySchema,
  /** 전체 주소 */
  location: z.string(),
  /** 찾아오는 길 한 줄 (예: 성수역 3번 출구 5분) */
  locationNote: z.string(),
  images: z.array(z.url()).max(CLASS_MAX_IMAGES),
  learnings: z.array(z.string()),
  /** offsetMinutes 오름차순 */
  curriculum: z.array(curriculumItemSchema),
  inclusions: z.string(),
  /** 공방 이름 */
  host: z.object({ name: z.string() }),
  /** 시작 시각 오름차순 */
  sessions: z.array(sessionSummarySchema),
});
export type ClassDetail = z.infer<typeof classDetailSchema>;
