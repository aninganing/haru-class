import type { Metadata } from 'next';
import { ClassDetailView } from '@/features/class/components/detail/ClassDetailView';
import { getClassDetail } from '@/features/class/api/get-class-detail';

// 이 세그먼트에는 loading.tsx를 두지 않는다. 스트리밍이 시작되기 전에 notFound()가 불려야 404 상태 코드가 나간다.

export async function generateMetadata({ params }: PageProps<'/classes/[classId]'>): Promise<Metadata> {
  const { classId } = await params;
  const detail = await getClassDetail(classId);
  return { title: detail.title, description: detail.summary };
}

export default async function ClassDetailPage({ params, searchParams }: PageProps<'/classes/[classId]'>) {
  const { classId } = await params;
  // 마감 임박 카드에서 들어오면 ?sessionId=가 붙는다. 상세 sessions에 없거나 마감이면 UpcomingSessions가 무시한다.
  const { sessionId } = await searchParams;
  const detail = await getClassDetail(classId);
  return <ClassDetailView detail={detail} selectedSessionId={Array.isArray(sessionId) ? sessionId[0] : sessionId} />;
}
