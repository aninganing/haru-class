import Link from 'next/link';

interface ComingSoonProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

/** 아직 만들지 않은 화면 자리 ("준비 중") */
export function ComingSoon({
  title,
  description = '곧 만나볼 수 있도록 준비하고 있어요.',
  backHref = '/',
  backLabel = '홈으로 가기',
}: ComingSoonProps) {
  return (
    <section className="flex flex-col items-start gap-3 py-8">
      <h1 className="text-500 font-bold">{title}</h1>
      <p className="text-fg-subtle">{description}</p>
      <Link href={backHref}>{backLabel}</Link>
    </section>
  );
}
