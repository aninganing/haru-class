import Link from 'next/link';

export default function ClassNotFound() {
  return (
    <section className="flex flex-col items-start gap-3 py-8">
      <h1 className="text-500 font-bold">클래스를 찾을 수 없어요</h1>
      <p className="text-fg-subtle">주소가 바뀌었거나 더 이상 열리지 않는 클래스예요.</p>
      <Link href="/">클래스 목록으로 가기</Link>
    </section>
  );
}
