import { type ClassDetail, classIdParamSchema } from '@haru/contracts';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/error';

/**
 * 서버 컴포넌트용 상세 조회. generateMetadata와 page가 같은 요청 안에서 한 번만 호출하도록 cache로 감싼다.
 * - id 형식이 틀리면 요청하지 않고 404
 * - API가 400(형식 오류) 또는 404(없음)를 주면 404
 * - 그 밖의 오류는 그대로 던져 error.tsx가 보여준다
 */
export const getClassDetail = cache(async (classId: string): Promise<ClassDetail> => {
  if (!classIdParamSchema.safeParse({ id: classId }).success) notFound();

  let detail: ClassDetail | undefined;
  try {
    detail = await api.get<ClassDetail>(`/classes/${encodeURIComponent(classId)}`);
  } catch (error) {
    if (!(error instanceof ApiError && (error.status === 400 || error.status === 404))) throw error;
  }
  // notFound()는 throw로 동작하므로 try/catch 밖에서 부른다.
  if (!detail) notFound();
  return detail;
});
