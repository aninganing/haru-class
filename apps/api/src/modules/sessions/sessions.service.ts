import { Inject, Injectable } from '@nestjs/common';
import {
  CLOSING_SOON_MAX_RATIO,
  CLOSING_SOON_MAX_REMAINING,
  CLOSING_SOON_WINDOW_DAYS,
  type ClosingSoonQuery,
  type ClosingSoonResponse,
} from '@haru/contracts';
import { CLOCK, type Clock } from '../../common/clock';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { type ClosingSoonRow, toClosingSoonItem } from './sessions.mapper';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * 마감 임박 회차: OPEN, now < startsAt <= now + 7일, 0 < 잔여,
   * (잔여 <= 2 또는 잔여 <= 정원 × 0.3). 클래스당 가장 이른 회차 1건. 정렬 startsAt, id 오름차순.
   * 컬럼 간 산술 비교라 tagged-template raw 쿼리를 쓴다.
   * 비율은 문자열을 numeric으로 캐스팅해 float 오차 없이 비교한다.
   */
  async closingSoon({ limit, category }: ClosingSoonQuery): Promise<ClosingSoonResponse> {
    const now = this.clock();
    const windowEnd = new Date(now.getTime() + CLOSING_SOON_WINDOW_DAYS * DAY_MS);
    const categoryFilter = category ? Prisma.sql`AND c.category = ${category}::class_category` : Prisma.empty;

    // 클래스당 가장 이른 조건 충족 회차 1건(DISTINCT ON)을 뽑은 뒤, 바깥에서 시작 시각 순으로 정렬·자른다.
    const rows = await this.prisma.$queryRaw<ClosingSoonRow[]>`
      SELECT * FROM (
        SELECT DISTINCT ON (c.id)
               s.id AS "sessionId",
               s.starts_at AS "startsAt",
               s.capacity,
               (s.capacity - s.reserved) AS remaining,
               c.id AS "classId",
               c.title,
               c.category::text AS category,
               c.neighborhood,
               c.price,
               c.duration_minutes AS "durationMinutes",
               c.images
        FROM class_sessions s
        JOIN classes c ON c.id = s.class_id
        WHERE s.status = 'OPEN'
          AND s.starts_at > ${now}
          AND s.starts_at <= ${windowEnd}
          AND s.reserved < s.capacity
          AND (
            (s.capacity - s.reserved) <= ${CLOSING_SOON_MAX_REMAINING}
            OR (s.capacity - s.reserved) <= s.capacity * ${String(CLOSING_SOON_MAX_RATIO)}::numeric
          )
          ${categoryFilter}
        ORDER BY c.id, s.starts_at ASC, s.id ASC
      ) AS first_per_class
      ORDER BY "startsAt" ASC, "sessionId" ASC
      LIMIT ${limit}`;

    return { items: rows.map(toClosingSoonItem) };
  }
}
