import { Badge } from '@aninganing/react';
import { CLASS_CATEGORY_LABELS, CLASS_DIFFICULTY_LABELS, type ClassDetail, REFUND_POLICY } from '@haru/contracts';
import { ClockIcon, LevelIcon, PeopleIcon, PinIcon } from '@/components/ui/icons';
import { BackButton } from './BackButton';
import { BookingCta } from './BookingCta';
import { ClassGallery } from './ClassGallery';
import { ClassInfoTabs } from './ClassInfoTabs';
import { formatDuration, formatPrice } from '@/features/class/utils/format';
import { ShareButton } from './ShareButton';
import { UpcomingSessions } from './UpcomingSessions';

const factIconClass = 'absolute top-px left-0 text-fg-subtle';

/**
 * 클래스 상세 화면. 데이터를 받지 않는 동기 컴포넌트라 서버 페이지에서 그대로 렌더링하고,
 * 테스트·스토리에서는 props만으로 상태별 화면을 만든다.
 *
 * DOM 순서는 하나(위쪽 → 요약 → 정보 → 예약 영역 → 탭 → 환불)이고 배치만 바꾼다.
 * - lg(64rem) 미만: 1단, 갤러리가 화면 위를 채우고 회차 선택 CTA는 화면 아래 고정 바 (본문은 pb-cta-bar만큼 비움)
 * - lg 이상: 2단 그리드. 왼쪽 열(col-start-1)에 차례로 쌓고, 예약 카드는 오른쪽 열 1~5행을 차지하며 sticky
 */
export function ClassDetailView({ detail, selectedSessionId }: { detail: ClassDetail; selectedSessionId?: string }) {
  const price = (
    <>
      {formatPrice(detail.price)} <span className="text-100 font-regular text-fg-subtle">/ 1인</span>
    </>
  );

  return (
    <article className="flex flex-col gap-6 pb-cta-bar lg:grid lg:grid-cols-detail lg:items-start lg:gap-x-10 lg:gap-y-6 lg:pt-6 lg:pb-12">
      <div className="relative -mx-5 md:mx-0 lg:col-start-1 lg:flex lg:flex-col lg:gap-3">
        <div className="pointer-events-none absolute inset-x-3 top-3 z-2 flex justify-between *:pointer-events-auto lg:static">
          <BackButton />
          <ShareButton title={detail.title} />
        </div>
        <ClassGallery images={detail.images} />
      </div>

      <header className="flex flex-col gap-2 lg:col-start-1">
        <div className="flex flex-wrap gap-2">
          <Badge>{CLASS_CATEGORY_LABELS[detail.category]}</Badge>
          {detail.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <h1 className="mt-1 text-500 leading-tight font-bold tracking-tight wrap-anywhere">{detail.title}</h1>
        <p className="text-100 text-fg-subtle">{detail.host.name}</p>
        <p className="mt-2 text-500 font-bold tabular-nums lg:hidden">{price}</p>
      </header>

      {/* dl > div > dt + dd 구조를 지키려고 아이콘은 dt 안에 두고 왼쪽 여백(pl-6.5)에 띄운다 */}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-4 rounded-lg bg-surface-subtle p-4 md:grid-cols-4 lg:col-start-1">
        <div className="relative pl-6.5">
          <dt className="text-50 text-fg-subtle">
            <ClockIcon size={18} className={factIconClass} />
            소요 시간
          </dt>
          <dd className="text-100 font-medium wrap-anywhere">{formatDuration(detail.durationMinutes)}</dd>
        </div>
        <div className="relative pl-6.5">
          <dt className="text-50 text-fg-subtle">
            <PeopleIcon size={18} className={factIconClass} />
            정원
          </dt>
          <dd className="text-100 font-medium wrap-anywhere">
            {detail.maxCapacity ? `회차당 최대 ${detail.maxCapacity}명` : '회차 준비 중'}
          </dd>
        </div>
        <div className="relative pl-6.5">
          <dt className="text-50 text-fg-subtle">
            <PinIcon size={18} className={factIconClass} />
            위치
          </dt>
          <dd className="text-100 font-medium wrap-anywhere">{detail.locationNote}</dd>
        </div>
        <div className="relative pl-6.5">
          <dt className="text-50 text-fg-subtle">
            <LevelIcon size={18} className={factIconClass} />
            난이도
          </dt>
          <dd className="text-100 font-medium wrap-anywhere">{CLASS_DIFFICULTY_LABELS[detail.difficulty]}</dd>
        </div>
      </dl>

      <aside
        className="flex flex-col gap-4 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-5 lg:row-start-1 lg:rounded-lg lg:border lg:border-line lg:p-5"
        aria-label="예약"
      >
        <p className="hidden text-500 font-bold tabular-nums lg:block">{price}</p>
        <UpcomingSessions classId={detail.id} sessions={detail.sessions} selectedSessionId={selectedSessionId} />
        <BookingCta detail={detail} />
      </aside>

      <ClassInfoTabs detail={detail} />

      <section className="rounded-md bg-surface-subtle p-4 text-100 lg:col-start-1" aria-labelledby="refund-title">
        <h2 id="refund-title" className="mb-1 font-semibold">
          환불 규정
        </h2>
        <ul className="list-disc pl-5 leading-relaxed text-fg-subtle">
          {REFUND_POLICY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
