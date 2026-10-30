import { Badge, Card, Skeleton } from '@aninganing/react';
import type { ClosingSoonItem } from '@haru/contracts';
import Link from 'next/link';
import { ClassThumbnail } from '@/features/class/components/ClassThumbnail';
import { formatDuration, formatPrice, formatShortDateTime } from '@/features/class/utils/format';

/** 마감 임박 회차 카드. 정의상 항상 마감 임박이라 잔여석 배지는 danger다. */
export function ClosingSoonCard({ item }: { item: ClosingSoonItem }) {
  return (
    <Card interactive className="relative">
      <Card.Media badge={<Badge tone="danger">잔여 {item.remaining}석</Badge>}>
        <ClassThumbnail src={item.class.thumbnailUrl} sizes="220px" />
      </Card.Media>
      <Card.Body>
        <Card.Title as="h3" className="wrap-anywhere">
          <Link
            href={`/classes/${item.class.id}?sessionId=${encodeURIComponent(item.sessionId)}`}
            className="after:absolute after:inset-0 hover:underline"
          >
            {item.class.title}
          </Link>
        </Card.Title>
        <p className="text-100 text-fg-subtle">
          {item.class.neighborhood} · {formatDuration(item.class.durationMinutes)}
        </p>
        <p className="text-100 font-medium tabular-nums">{formatShortDateTime(item.startsAt)}</p>
        <p className="mt-1 text-200 font-bold tabular-nums">{formatPrice(item.class.price)}</p>
      </Card.Body>
    </Card>
  );
}

export function ClosingSoonCardSkeleton() {
  return (
    <Card aria-hidden="true">
      <Card.Media>
        <Skeleton shape="rect" height="100%" />
      </Card.Media>
      <Card.Body>
        <Skeleton width="80%" />
        <Skeleton width="50%" />
        <Skeleton width="40%" />
      </Card.Body>
    </Card>
  );
}
