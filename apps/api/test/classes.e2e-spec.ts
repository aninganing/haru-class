import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  type ClassCategory,
  type ClassSummary,
  apiErrorSchema,
  classDetailSchema,
  classListResponseSchema,
} from '@haru/contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// dev와 같은 DB를 쓴다. 이 테스트가 만든 데이터(e2e-classes-* 호스트)만 만들고 지운다.
// 테스트 클래스는 createdAt을 2099년으로 둬서 목록 맨 앞에 오게 한다.
const EMAIL_PREFIX = 'e2e-classes-';
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const IMAGE = (k: number) => `https://picsum.photos/seed/e2e-${k}/960/640`;

describe('/classes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const ids = { newest: '', tieA: '', tieB: '', scent: '', oldest: '', mixed: '', noSessions: '' };
  // ids에 넣지 않는 보조 데이터 (createdAt 2098년이라 위 목록 순서에 끼지 않는다)
  const extra = { sameStart: '', sameStartSessions: [] as string[], soldOutOnly: '' };
  let hostId = '';
  let makeClass: (title: string, createdAt: string) => Promise<{ id: string }>;
  const expected = { mixedNextSessionAt: '' };

  const cleanup = async () => {
    const hosts = { email: { startsWith: EMAIL_PREFIX } };
    await prisma.class.deleteMany({ where: { host: hosts } });
    await prisma.user.deleteMany({ where: hosts });
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    await cleanup();

    const host = await prisma.user.create({
      data: { email: `${EMAIL_PREFIX}${Date.now()}@test.local`, name: 'e2e 공방' },
    });
    hostId = host.id;
    const now = Date.now();
    const at = (offset: number) => new Date(now + offset);
    const session = (
      startOffset: number,
      extra: { capacity?: number; reserved?: number; status?: 'OPEN' | 'CLOSED' } = {},
    ) => ({
      startsAt: at(startOffset),
      endsAt: at(startOffset + 2 * HOUR),
      capacity: extra.capacity ?? 5,
      reserved: extra.reserved ?? 0,
      status: extra.status ?? 'OPEN',
    });
    const make = (
      title: string,
      createdAt: string,
      category: ClassCategory,
      sessions: ReturnType<typeof session>[] = [],
      extra: { images?: string[]; curriculum?: unknown } = {},
    ) =>
      prisma.class.create({
        data: {
          hostId: host.id,
          title,
          summary: `${title} 요약`,
          description: `${title} 설명`,
          category,
          difficulty: 'BEGINNER',
          tags: ['e2e'],
          neighborhood: 'e2e동',
          location: '서울 e2e구 e2e로 1',
          locationNote: 'e2e역 1번 출구',
          price: 10000,
          durationMinutes: 120,
          images: extra.images ?? [],
          learnings: ['배울 것'],
          curriculum: (extra.curriculum ?? []) as object,
          inclusions: '재료비 포함',
          createdAt: new Date(createdAt),
          sessions: { create: sessions },
        },
      });

    const openLater = session(3 * DAY, { capacity: 7 });
    const mixed = await make(
      'e2e 회차 섞임',
      '2099-01-03T00:00:00.000Z',
      'FLOWER',
      [
        session(-1 * DAY, { capacity: 30 }),
        session(1 * HOUR, { status: 'CLOSED', capacity: 20 }),
        session(2 * HOUR, { capacity: 15, reserved: 15 }),
        openLater,
        session(5 * DAY, { capacity: 9, reserved: 8 }),
      ],
      {
        images: [IMAGE(1), IMAGE(2)],
        curriculum: [
          { offsetMinutes: 90, title: '마무리' },
          { offsetMinutes: 0, title: '인사' },
          { offsetMinutes: 30, title: '실습' },
        ],
      },
    );
    ids.mixed = ids.newest = mixed.id;
    expected.mixedNextSessionAt = openLater.startsAt.toISOString();

    const tieAt = '2099-01-02T00:00:00.000Z';
    const tie1 = await make('e2e 동률 1', tieAt, 'FLOWER', [
      session(-2 * DAY),
      session(DAY, { status: 'CLOSED' }),
      session(DAY, { capacity: 3, reserved: 3 }),
    ]);
    const tie2 = await make('e2e 동률 2', tieAt, 'FLOWER', [], { curriculum: [{ title: '형식 틀림' }] });
    [ids.tieA, ids.tieB] = [tie1.id, tie2.id].sort().reverse(); // id 내림차순
    extra.soldOutOnly = tie1.id; // 미래·OPEN 회차는 매진 1건뿐
    ids.noSessions = tie2.id;

    ids.scent = (await make('e2e 향', '2099-01-01T12:00:00.000Z', 'SCENT')).id;
    ids.oldest = (await make('e2e 가장 오래됨', '2099-01-01T00:00:00.000Z', 'FLOWER')).id;

    // 같은 startsAt 회차 3개 → 상세에서 id 오름차순
    const sameAt = session(2 * DAY, { capacity: 6 });
    const same = await make('e2e 같은 시작 시각', '2098-06-01T00:00:00.000Z', 'CRAFT', [sameAt, { ...sameAt }, { ...sameAt }]);
    extra.sameStart = same.id;
    extra.sameStartSessions = (await prisma.classSession.findMany({ where: { classId: same.id }, select: { id: true } }))
      .map((row) => row.id)
      .sort();

    makeClass = (title, createdAt) => make(title, createdAt, 'CRAFT');
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  const server = () => app.getHttpServer();
  const list = (query: string) => request(server()).get(`/classes${query ? `?${query}` : ''}`);

  const walk = async (query: string, pages: number) => {
    const seen: string[] = [];
    let cursor: string | null = null;
    for (let i = 0; i < pages; i++) {
      const res = await list([query, cursor && `cursor=${cursor}`].filter(Boolean).join('&')).expect(200);
      const body = classListResponseSchema.parse(res.body);
      seen.push(...body.items.map((item) => item.id));
      cursor = body.nextCursor;
      if (!cursor) break;
    }
    return seen;
  };

  describe('GET /classes', () => {
    it('기본 요청은 최대 20개를 contracts 형태로 준다', async () => {
      const res = await list('').expect(200);
      const body = classListResponseSchema.parse(res.body);
      expect(body.items.length).toBeLessThanOrEqual(20);
      expect(body.items[0].id).toBe(ids.newest);
      expect(body.items[0]).not.toHaveProperty('location');
    });

    it.each([['limit=0'], ['limit=51'], ['limit=abc'], ['limit=1.5'], ['limit=1&limit=2']])('%s 이면 400', async (query) => {
      const res = await list(query).expect(400);
      expect(apiErrorSchema.parse(res.body).statusCode).toBe(400);
    });

    it.each([['category=flower'], ['category=FOO'], ['category=FLOWER&category=SCENT'], ['category=']])(
      '%s 이면 400',
      async (query) => {
        const res = await list(query).expect(400);
        expect(apiErrorSchema.parse(res.body).statusCode).toBe(400);
      },
    );

    it.each([
      ['base64url이 아닌 문자', 'cursor=abc$%25'],
      ['JSON이 아닌 내용', `cursor=${Buffer.from('hello').toString('base64url')}`],
      ['모양이 다른 JSON', `cursor=${Buffer.from(JSON.stringify({ c: 'x', i: 'y' })).toString('base64url')}`],
    ])('cursor가 %s이면 400과 안내 문구', async (_, query) => {
      const res = await list(query).expect(400);
      expect(apiErrorSchema.parse(res.body).message).toBe('목록 위치 정보가 올바르지 않아요');
    });

    it('cursor를 두 번 보내면 400', async () => {
      await list('cursor=a&cursor=b').expect(400);
    });

    it('limit=1로 넘기면 createdAt이 같은 클래스도 id 내림차순으로 빠짐없이 한 번씩 나온다', async () => {
      const seen = await walk('limit=1', 6);
      expect(seen.slice(0, 5)).toEqual([ids.newest, ids.tieA, ids.tieB, ids.scent, ids.oldest]);
      if (seen[5]) expect(Object.values(ids)).not.toContain(seen[5]);
    });

    it('category와 cursor를 함께 쓰면 그 카테고리 안에서 이어서 넘긴다', async () => {
      const seen = await walk('limit=1&category=FLOWER', 4);
      expect(seen).toEqual([ids.newest, ids.tieA, ids.tieB, ids.oldest]);

      const res = await list('category=SCENT&limit=50').expect(200);
      const body = classListResponseSchema.parse(res.body);
      expect(body.items[0].id).toBe(ids.scent);
      expect(body.items.every((item) => item.category === 'SCENT')).toBe(true);
    });

    it('전체를 넘겨도 중복 없이 createdAt desc, id desc 순서이고 마지막 페이지는 nextCursor가 null', async () => {
      const all: string[] = [];
      let cursor: string | null = null;
      let pages = 0;
      do {
        const res = await list(cursor ? `limit=50&cursor=${cursor}` : 'limit=50').expect(200);
        const body = classListResponseSchema.parse(res.body);
        all.push(...body.items.map((item) => item.id));
        cursor = body.nextCursor;
        pages++;
      } while (cursor && pages < 100);

      expect(cursor).toBeNull();
      expect(new Set(all).size).toBe(all.length);

      const rows = await prisma.class.findMany({ where: { id: { in: all } }, select: { id: true, createdAt: true } });
      const createdAt = new Map(rows.map((row) => [row.id, row.createdAt.getTime()]));
      for (let i = 1; i < all.length; i++) {
        const [prev, cur] = [createdAt.get(all[i - 1])!, createdAt.get(all[i])!];
        expect(prev > cur || (prev === cur && all[i - 1] > all[i])).toBe(true);
      }
    });

    it('커서가 가리키던 클래스가 지워져도 그 위치 다음부터 이어 받는다', async () => {
      const x = await makeClass('e2e 커서 X', '2099-03-03T00:00:00.000Z');
      const y = await makeClass('e2e 커서 Y', '2099-03-02T00:00:00.000Z');
      const z = await makeClass('e2e 커서 Z', '2099-03-01T00:00:00.000Z');
      try {
        const first = classListResponseSchema.parse((await list('limit=1').expect(200)).body);
        expect(first.items[0].id).toBe(x.id);
        const second = classListResponseSchema.parse((await list(`limit=1&cursor=${first.nextCursor}`).expect(200)).body);
        expect(second.items[0].id).toBe(y.id);

        await prisma.class.delete({ where: { id: y.id } });

        const third = classListResponseSchema.parse((await list(`limit=1&cursor=${second.nextCursor}`).expect(200)).body);
        expect(third.items[0].id).toBe(z.id);
      } finally {
        await prisma.class.deleteMany({ where: { id: { in: [x.id, y.id, z.id] } } });
      }
    });

    it('reserved가 capacity를 넘는 회차는 DB CHECK가 막아서 만들어지지 않는다', async () => {
      const at = new Date(Date.now() + DAY);
      await expect(
        prisma.classSession.create({
          data: { classId: ids.oldest, startsAt: at, endsAt: new Date(at.getTime() + HOUR), capacity: 4, reserved: 5 },
        }),
      ).rejects.toThrow();
      expect(hostId).not.toBe('');
    });

    it('nextSessionAt·maxCapacity는 지난·CLOSED·매진 회차를 빼고 계산하고, 없으면 null', async () => {
      const res = await list('limit=10').expect(200);
      const items = new Map<string, ClassSummary>(
        classListResponseSchema.parse(res.body).items.map((item) => [item.id, item]),
      );

      expect(items.get(ids.mixed)).toMatchObject({
        nextSessionAt: expected.mixedNextSessionAt,
        maxCapacity: 9,
        thumbnailUrl: IMAGE(1),
        isNew: true,
      });
      // 동률 1: 지난·CLOSED·매진만 있다 / 동률 2: 회차 없음
      expect(items.get(ids.tieA)).toMatchObject({ nextSessionAt: null, maxCapacity: null });
      expect(items.get(ids.tieB)).toMatchObject({ nextSessionAt: null, maxCapacity: null });
      expect(items.get(ids.oldest)).toMatchObject({ nextSessionAt: null, maxCapacity: null, thumbnailUrl: null });
    });
  });

  describe('GET /classes/:id', () => {
    it('미래이고 OPEN인 회차만 시작 오름차순으로, 매진은 SOLD_OUT으로 준다', async () => {
      const res = await request(server()).get(`/classes/${ids.mixed}`).expect(200);
      const body = classDetailSchema.parse(res.body);

      expect(body).toMatchObject({
        host: { name: 'e2e 공방' },
        description: 'e2e 회차 섞임 설명',
        category: 'FLOWER',
        difficulty: 'BEGINNER',
        location: '서울 e2e구 e2e로 1',
        locationNote: 'e2e역 1번 출구',
        images: [IMAGE(1), IMAGE(2)],
        thumbnailUrl: IMAGE(1),
        learnings: ['배울 것'],
        inclusions: '재료비 포함',
        maxCapacity: 9,
      });
      expect(body.sessions.map((s) => [s.status, s.remaining, s.capacity])).toEqual([
        ['SOLD_OUT', 0, 15],
        ['OPEN', 7, 7],
        ['OPEN', 1, 9],
      ]);
      const starts = body.sessions.map((s) => Date.parse(s.startsAt));
      expect([...starts].sort((a, b) => a - b)).toEqual(starts);
      expect(starts.every((t) => t > Date.now())).toBe(true);
      expect(body.sessions[1].startsAt).toBe(expected.mixedNextSessionAt);
      expect(body.sessions[0].startsAt.endsWith('Z')).toBe(true);
    });

    it('커리큘럼은 offsetMinutes 오름차순', async () => {
      const res = await request(server()).get(`/classes/${ids.mixed}`).expect(200);
      expect(classDetailSchema.parse(res.body).curriculum).toEqual([
        { offsetMinutes: 0, title: '인사' },
        { offsetMinutes: 30, title: '실습' },
        { offsetMinutes: 90, title: '마무리' },
      ]);
    });

    it('회차가 없고 커리큘럼 형식이 틀린 클래스도 200이고, sessions·curriculum은 빈 배열', async () => {
      const res = await request(server()).get(`/classes/${ids.noSessions}`).expect(200);
      const body = classDetailSchema.parse(res.body);
      expect(body.sessions).toEqual([]);
      expect(body.curriculum).toEqual([]);
      expect(body.maxCapacity).toBeNull();
    });

    it('같은 시작 시각의 회차는 id 오름차순', async () => {
      const res = await request(server()).get(`/classes/${extra.sameStart}`).expect(200);
      expect(classDetailSchema.parse(res.body).sessions.map((s) => s.id)).toEqual(extra.sameStartSessions);
    });

    it('매진 회차만 남은 클래스는 목록에서 예약 가능 회차 없음, 상세에서 SOLD_OUT 1건으로 일관된다', async () => {
      const listBody = classListResponseSchema.parse((await list('limit=10').expect(200)).body);
      const summary = listBody.items.find((item) => item.id === extra.soldOutOnly);
      expect(summary).toMatchObject({ nextSessionAt: null, maxCapacity: null });

      const detail = classDetailSchema.parse((await request(server()).get(`/classes/${extra.soldOutOnly}`).expect(200)).body);
      expect(detail.maxCapacity).toBeNull();
      expect(detail.sessions.map((s) => [s.status, s.remaining, s.capacity])).toEqual([['SOLD_OUT', 0, 3]]);
    });

    it('형식이 틀린 id는 400', async () => {
      const res = await request(server()).get('/classes/not-a-cuid!').expect(400);
      expect(apiErrorSchema.parse(res.body).statusCode).toBe(400);
    });

    it('형식은 맞지만 없는 id는 404와 안내 문구', async () => {
      const res = await request(server()).get('/classes/cnotexist00000000000000000').expect(404);
      expect(apiErrorSchema.parse(res.body).message).toBe('클래스를 찾을 수 없어요');
    });
  });
});
