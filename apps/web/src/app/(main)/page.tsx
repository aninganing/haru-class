import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { parseCategory } from '@/features/class/utils/category';
import { CategoryChips } from '@/features/class/components/list/CategoryChips';
import { ClassList } from '@/features/class/components/list/ClassList';
import { classListInfiniteQuery } from '@/features/class/api/queries';
import { ClosingSoonSection } from '@/features/session/components/ClosingSoonSection';
import { closingSoonQuery } from '@/features/session/api/queries';
import { getQueryClient } from '@/lib/query/get-query-client';

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  // 카테고리는 URL에 둔다 (SSR·뒤로 가기·공유). 모르는 값은 전체로 본다.
  const category = parseCategory((await searchParams).category);
  const queryClient = getQueryClient();
  // 첫 화면 데이터를 서버에서 불러와 HTML에 넣는다 (SEO). 실패하면 클라이언트에서 다시 요청한다.
  await Promise.all([
    queryClient.prefetchInfiniteQuery(classListInfiniteQuery(category)),
    queryClient.prefetchQuery(closingSoonQuery(category)),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <h1 className="sr-only">클래스 둘러보기</h1>
      <CategoryChips category={category} />
      <ClosingSoonSection key={`closing-${category ?? 'ALL'}`} category={category} />
      <ClassList key={`list-${category ?? 'ALL'}`} category={category} />
    </HydrationBoundary>
  );
}
