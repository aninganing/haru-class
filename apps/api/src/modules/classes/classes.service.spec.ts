import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CLOCK } from '../../common/clock';
import { PrismaService } from '../../prisma/prisma.service';
import { decodeClassCursor, encodeClassCursor } from './class-cursor';
import { CLASS_NOT_FOUND_MESSAGE, ClassesService } from './classes.service';

const NOW = new Date('2026-10-27T03:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const CAPACITY_REF = { modelName: 'ClassSession', name: 'capacity' };
const ID = 'cmh8q2x0a0000abcd1234efgh';

const classRow = (n: number, overrides: Record<string, unknown> = {}) => ({
  id: `cls${String(n).padStart(22, '0')}`,
  title: `클래스 ${n}`,
  summary: '요약',
  category: 'CRAFT' as const,
  tags: ['도자기'],
  neighborhood: '성수동',
  price: 35000,
  durationMinutes: 120,
  images: [`https://picsum.photos/seed/${n}-1/960/640`, `https://picsum.photos/seed/${n}-2/960/640`],
  createdAt: new Date(NOW.getTime() - 30 * DAY - n * 60_000),
  ...overrides,
});

const sessionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'ses0000000000000000000001',
  startsAt: new Date('2026-10-28T05:00:00.000Z'),
  endsAt: new Date('2026-10-28T07:00:00.000Z'),
  capacity: 8,
  reserved: 3,
  ...overrides,
});

describe('ClassesService', () => {
  const prisma = {
    class: { findMany: vi.fn(), findUnique: vi.fn() },
    classSession: { groupBy: vi.fn(), fields: { capacity: CAPACITY_REF } },
  };
  let service: ClassesService;

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.classSession.groupBy.mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: PrismaService, useValue: prisma },
        { provide: CLOCK, useValue: () => NOW },
      ],
    }).compile();
    service = moduleRef.get(ClassesService);
  });

  describe('list', () => {
    it('limit+1개를 읽어 다음 페이지가 있으면 limit개만 주고 마지막 항목으로 nextCursor를 만든다', async () => {
      const rows = [1, 2, 3].map((n) => classRow(n));
      prisma.class.findMany.mockResolvedValue(rows);

      const res = await service.list({ limit: 2 });

      expect(prisma.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
      );
      expect(res.items.map((item) => item.id)).toEqual([rows[0].id, rows[1].id]);
      expect(decodeClassCursor(res.nextCursor!)).toEqual({ createdAt: rows[1].createdAt, id: rows[1].id });
    });

    it('딱 limit개면 마지막 페이지라 nextCursor가 null', async () => {
      prisma.class.findMany.mockResolvedValue([classRow(1), classRow(2)]);

      const res = await service.list({ limit: 2 });

      expect(res.items).toHaveLength(2);
      expect(res.nextCursor).toBeNull();
    });

    it('클래스가 없으면 빈 목록이고 회차 집계를 하지 않는다', async () => {
      prisma.class.findMany.mockResolvedValue([]);

      await expect(service.list({ limit: 20 })).resolves.toEqual({ items: [], nextCursor: null });
      expect(prisma.classSession.groupBy).not.toHaveBeenCalled();
    });

    it('필터가 없으면 조건 없이 읽는다', async () => {
      prisma.class.findMany.mockResolvedValue([]);

      await service.list({ limit: 20 });

      expect(prisma.class.findMany.mock.calls[0][0].where).toEqual({ AND: [{}, {}] });
    });

    it('category만 있으면 그 카테고리만 읽는다', async () => {
      prisma.class.findMany.mockResolvedValue([]);

      await service.list({ limit: 20, category: 'FLOWER' });

      expect(prisma.class.findMany.mock.calls[0][0].where).toEqual({ AND: [{ category: 'FLOWER' }, {}] });
    });

    it('category와 커서를 함께 주면 카테고리 안에서 커서 뒤(createdAt이 작거나, 같고 id가 작은) 것을 읽는다', async () => {
      const createdAt = new Date('2026-10-20T00:00:00.000Z');
      prisma.class.findMany.mockResolvedValue([]);

      await service.list({ limit: 20, category: 'SCENT', cursor: encodeClassCursor({ createdAt, id: ID }) });

      expect(prisma.class.findMany.mock.calls[0][0].where).toEqual({
        AND: [{ category: 'SCENT' }, { OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: ID } }] }],
      });
    });

    it('잘못된 커서는 DB를 부르지 않고 400', async () => {
      await expect(service.list({ limit: 20, cursor: '!!!' })).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.class.findMany).not.toHaveBeenCalled();
    });

    it('클래스가 여러 개여도 회차 집계는 한 번이고, 가장 이른 시작과 가장 큰 정원을 같이 구한다', async () => {
      const rows = [1, 2, 3, 4, 5].map((n) => classRow(n));
      prisma.class.findMany.mockResolvedValue(rows);

      await service.list({ limit: 20 });

      expect(prisma.classSession.groupBy).toHaveBeenCalledTimes(1);
      expect(prisma.classSession.groupBy).toHaveBeenCalledWith({
        by: ['classId'],
        where: {
          classId: { in: rows.map((row) => row.id) },
          status: 'OPEN',
          startsAt: { gt: NOW },
          reserved: { lt: CAPACITY_REF },
        },
        _min: { startsAt: true },
        _max: { capacity: true },
      });
    });

    it('예약 가능한 회차가 있으면 nextSessionAt·maxCapacity를, 없으면 둘 다 null을 준다', async () => {
      const [withSession, without] = [classRow(1), classRow(2, { images: [] })];
      prisma.class.findMany.mockResolvedValue([withSession, without]);
      prisma.classSession.groupBy.mockResolvedValue([
        { classId: withSession.id, _min: { startsAt: new Date('2026-10-28T14:30:00.000Z') }, _max: { capacity: 12 } },
      ]);

      const res = await service.list({ limit: 20 });

      expect(res.items[0]).toEqual({
        id: withSession.id,
        title: withSession.title,
        summary: withSession.summary,
        category: 'CRAFT',
        tags: ['도자기'],
        neighborhood: '성수동',
        price: withSession.price,
        durationMinutes: withSession.durationMinutes,
        thumbnailUrl: withSession.images[0],
        maxCapacity: 12,
        isNew: false,
        nextSessionAt: '2026-10-28T14:30:00.000Z',
      });
      expect(res.items[1]).toMatchObject({ thumbnailUrl: null, nextSessionAt: null, maxCapacity: null });
      expect(res.items[0]).not.toHaveProperty('location');
      expect(res.items[0]).not.toHaveProperty('createdAt');
    });

    it.each([
      ['정확히 14일 전', 14 * DAY, true],
      ['14일 + 1ms 전', 14 * DAY + 1, false],
      ['방금', 0, true],
      ['미래(시계 오차)', -DAY, true],
    ])('isNew: %s 만든 클래스는 %s', async (_, age, expected) => {
      prisma.class.findMany.mockResolvedValue([classRow(1, { createdAt: new Date(NOW.getTime() - age) })]);

      const [item] = (await service.list({ limit: 20 })).items;

      expect(item.isNew).toBe(expected);
    });
  });

  describe('findOne', () => {
    const detailRow = (overrides: Record<string, unknown> = {}) => ({
      ...classRow(1),
      description: '자세한 설명',
      difficulty: 'BEGINNER' as const,
      location: '서울 성동구 연무장길 41 3층',
      locationNote: '성수역 3번 출구 5분',
      learnings: ['물레 다루기'],
      curriculum: [
        { offsetMinutes: 0, title: '인사' },
        { offsetMinutes: 30, title: '실습' },
      ],
      inclusions: '재료비 포함',
      host: { name: '하루공방' },
      sessions: [] as ReturnType<typeof sessionRow>[],
      ...overrides,
    });

    it('없는 클래스면 404와 안내 문구', async () => {
      prisma.class.findUnique.mockResolvedValue(null);

      const promise = service.findOne(ID);
      await expect(promise).rejects.toBeInstanceOf(NotFoundException);
      await expect(promise).rejects.toThrow(CLASS_NOT_FOUND_MESSAGE);
    });

    it('미래이고 OPEN인 회차만 시작 시각 오름차순으로 읽는다', async () => {
      prisma.class.findUnique.mockResolvedValue(detailRow());

      await service.findOne(ID);

      const args = prisma.class.findUnique.mock.calls[0][0];
      expect(args.where).toEqual({ id: ID });
      expect(args.select.sessions).toMatchObject({
        where: { status: 'OPEN', startsAt: { gt: NOW } },
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      });
    });

    it('상세 필드를 contracts 형태로 주고, 대표 이미지는 images의 첫 장', async () => {
      const row = detailRow();
      prisma.class.findUnique.mockResolvedValue(row);

      const res = await service.findOne(ID);

      expect(res).toMatchObject({
        category: 'CRAFT',
        difficulty: 'BEGINNER',
        location: row.location,
        locationNote: row.locationNote,
        images: row.images,
        thumbnailUrl: row.images[0],
        learnings: ['물레 다루기'],
        inclusions: '재료비 포함',
        host: { name: '하루공방' },
        description: '자세한 설명',
      });
    });

    it('남은 좌석이 있으면 OPEN과 남은 수, 시간은 UTC ISO 문자열', async () => {
      prisma.class.findUnique.mockResolvedValue(detailRow({ sessions: [sessionRow({ capacity: 8, reserved: 3 })] }));

      const res = await service.findOne(ID);

      expect(res.sessions).toEqual([
        {
          id: 'ses0000000000000000000001',
          startsAt: '2026-10-28T05:00:00.000Z',
          endsAt: '2026-10-28T07:00:00.000Z',
          capacity: 8,
          remaining: 5,
          status: 'OPEN',
        },
      ]);
    });

    it('reserved가 capacity와 같으면 SOLD_OUT이고 남은 좌석 0', async () => {
      prisma.class.findUnique.mockResolvedValue(detailRow({ sessions: [sessionRow({ capacity: 6, reserved: 6 })] }));

      const [session] = (await service.findOne(ID)).sessions;

      expect(session).toMatchObject({ remaining: 0, status: 'SOLD_OUT' });
    });

    it('reserved가 capacity를 넘어도 남은 좌석은 음수가 아닌 0', async () => {
      prisma.class.findUnique.mockResolvedValue(detailRow({ sessions: [sessionRow({ capacity: 4, reserved: 7 })] }));

      const [session] = (await service.findOne(ID)).sessions;

      expect(session).toMatchObject({ remaining: 0, status: 'SOLD_OUT' });
    });

    it('maxCapacity는 매진 회차를 빼고 가장 큰 정원', async () => {
      prisma.class.findUnique.mockResolvedValue(
        detailRow({
          sessions: [
            sessionRow({ id: 's1', capacity: 20, reserved: 20 }),
            sessionRow({ id: 's2', capacity: 10, reserved: 9 }),
            sessionRow({ id: 's3', capacity: 6, reserved: 0 }),
          ],
        }),
      );

      expect((await service.findOne(ID)).maxCapacity).toBe(10);
    });

    it('예약 가능한 회차가 없으면(전부 매진이거나 회차 없음) maxCapacity는 null', async () => {
      prisma.class.findUnique.mockResolvedValue(detailRow({ sessions: [sessionRow({ capacity: 4, reserved: 4 })] }));
      expect((await service.findOne(ID)).maxCapacity).toBeNull();

      prisma.class.findUnique.mockResolvedValue(detailRow({ sessions: [] }));
      expect((await service.findOne(ID)).maxCapacity).toBeNull();
    });

    it('이미지가 없으면 thumbnailUrl은 null, images는 빈 배열', async () => {
      prisma.class.findUnique.mockResolvedValue(detailRow({ images: [] }));

      const res = await service.findOne(ID);

      expect(res.thumbnailUrl).toBeNull();
      expect(res.images).toEqual([]);
    });
  });
});
