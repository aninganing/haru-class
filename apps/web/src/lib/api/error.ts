import { apiErrorSchema } from '@haru/contracts';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static async from(res: Response) {
    const body: unknown = await res.json().catch(() => null);
    const parsed = apiErrorSchema.safeParse(body);
    const message = parsed.success
      ? [parsed.data.message].flat().join('\n')
      : `요청에 실패했어요 (${res.status})`;
    return new ApiError(res.status, message);
  }
}
