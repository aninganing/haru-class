import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ClassDetail, ClassListQuery, ClassListResponse } from '@haru/contracts';
import { CLOCK, type Clock } from '../../common/clock';
import { PrismaService } from '../../prisma/prisma.service';
import { decodeClassCursor, encodeClassCursor } from './class-cursor';
import { type BookableAggregate, toClassDetail, toClassSummary } from './classes.mapper';

export const CLASS_NOT_FOUND_MESSAGE = '클래스를 찾을 수 없어요';

const classBaseSelect = {
  id: true,
  title: true,
  summary: true,
  category: true,
  tags: true,
  neighborhood: true,
  price: true,
  durationMinutes: true,
  images: true,
} as const;

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async list({ cursor, limit, category }: ClassListQuery): Promise<ClassListResponse> {
    // 잘못된 커서는 DB를 부르기 전에 400으로 끝낸다. 커서는 위치만 담고 필터와 묶지 않는다.
    const after = cursor ? decodeClassCursor(cursor) : null;
    const now = this.clock();

    const rows = await this.prisma.class.findMany({
      where: {
        AND: [
          category ? { category } : {},
          after
            ? {
                OR: [
                  { createdAt: { lt: after.createdAt } },
                  { createdAt: after.createdAt, id: { lt: after.id } },
                ],
              }
            : {},
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select: { ...classBaseSelect, createdAt: true },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const aggregates = await this.findBookableAggregates(
      page.map((row) => row.id),
      now,
    );

    const last = page.at(-1);
    return {
      items: page.map((row) => toClassSummary(row, aggregates.get(row.id), now)),
      nextCursor: hasMore && last ? encodeClassCursor({ createdAt: last.createdAt, id: last.id }) : null,
    };
  }

  async findOne(id: string): Promise<ClassDetail> {
    const now = this.clock();
    const row = await this.prisma.class.findUnique({
      where: { id },
      select: {
        ...classBaseSelect,
        description: true,
        difficulty: true,
        location: true,
        locationNote: true,
        learnings: true,
        curriculum: true,
        inclusions: true,
        host: { select: { name: true } },
        sessions: {
          where: { status: 'OPEN', startsAt: { gt: now } },
          orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
          select: { id: true, startsAt: true, endsAt: true, capacity: true, reserved: true },
        },
      },
    });
    if (!row) throw new NotFoundException(CLASS_NOT_FOUND_MESSAGE);
    return toClassDetail(row);
  }

  /**
   * 페이지의 클래스들에 대해 예약 가능한 회차(미래·OPEN·잔여>0)의
   * 가장 이른 시작 시각과 가장 큰 정원을 한 번의 집계로 구한다 (N+1 회피).
   */
  private async findBookableAggregates(classIds: string[], now: Date): Promise<Map<string, BookableAggregate>> {
    if (classIds.length === 0) return new Map();
    const groups = await this.prisma.classSession.groupBy({
      by: ['classId'],
      where: {
        classId: { in: classIds },
        status: 'OPEN',
        startsAt: { gt: now },
        reserved: { lt: this.prisma.classSession.fields.capacity },
      },
      _min: { startsAt: true },
      _max: { capacity: true },
    });
    return new Map(
      groups.map((group) => [
        group.classId,
        { nextSessionAt: group._min.startsAt ?? null, maxCapacity: group._max.capacity ?? null },
      ]),
    );
  }
}
