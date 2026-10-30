import type { Metadata } from 'next';
import { ComingSoon } from '@/components/layout/ComingSoon';
import { getClassDetail } from '@/features/class/api/get-class-detail';

export const metadata: Metadata = { title: '회차 선택' };

/** 회차·인원 선택은 다음 단계에서 만든다. ?sessionId=로 들어오면 그 회차를 미리 고르게 할 예정이다. */
export default async function SessionSelectPage({ params }: PageProps<'/classes/[classId]/sessions'>) {
  const { classId } = await params;
  // 없는 클래스면 여기서도 404
  const detail = await getClassDetail(classId);
  return (
    <ComingSoon
      title="회차 선택"
      description={`${detail.title}의 회차 선택은 준비 중이에요.`}
      backHref={`/classes/${classId}`}
      backLabel="클래스 정보로 돌아가기"
    />
  );
}
