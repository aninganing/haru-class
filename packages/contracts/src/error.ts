import { z } from 'zod';

/** Nest 기본 예외 응답 형태. web에서 에러 메시지를 꺼낼 때 쓴다. */
export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
