import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { apiErrorSchema, closingSoonResponseSchema } from '@haru/contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { CLOCK } from '../src/common/clock';
import { PrismaService } from '../src/prisma/prisma.service';

// 지금을 2099-06-01로 고정한다. dev 시드는 그 근처에 회차가 없어서 결과 목록 전체를 정확히 단정할 수 있다.
// 데이터는 e2e-sessions-* 호스트 소유로 만들고 지운다.
const EMAIL_PREFIX = 'e2e-sessions-';
const NOW = new Date('2099-06-01T00:00:00.000Z');
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const THUMB = 'https://picsum.photos/seed/e2e-closing/960/640';

describe('GET /sessions/closing-soon (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const s: Record<string, string> = {};
  const classOf: Record<string, string> = {};
  let hostId = '';

  const cleanup = async () => {
    const hosts = { email: { startsWith: EMAIL_PREFIX } };
    await prisma.class.deleteMany({ where: { host: hosts } });
    await prisma.user.deleteMany({ where: hosts });
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CLOCK)
      .useValue(() => NOW)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    await cleanup();

    const host = await prisma.user.create({ data: { email: `${EMAIL_PREFIX}${Date.now()}@test.local`, name: 'e2e 공방' } });
    hostId = host.id;
    // createdAt은 2098년: classes e2e(2099년)와 목록 위치가 겹치지 않게 한다.
    const makeClass = (category: 'FLOWER' | 'SCENT', images: string[], title = `e2e 마감 임박 ${category}`) =>
      prisma.class.create({
        data: {
          hostId: host.id,
          title,
          summary: '요약',
          description: '설명',
          category,
          difficulty: 'INTRO',
          neighborhood: '성수동',
          location: '서울 성동구',
          locationNote: '성수역',
          price: 42000,
          durationMinutes: 90,
          images,
          inclusions: '',
          createdAt: new Date('2098-01-01T00:00:00.000Z'),
        },
      });
    const at = (ms: number) => new Date(NOW.getTime() + ms);
    const addSession = async (key: string, classId: string, startsAt: Date, capacity: number, reserved: number, status: 'OPEN' | 'CLOSED' = 'OPEN') => {
      const created = await prisma.classSession.create({
        data: { classId, startsAt, endsAt: new Date(startsAt.getTime() + HOUR), capacity, reserved, status },
      });
      s[key] = created.id;
    };
    // 경계값 회차는 클래스당 1건 규칙에 가리지 않도록 각자 다른 클래스에 둔다.
    const own = async (key: string, startsAt: Date, capacity: number, reserved: number, status: 'OPEN' | 'CLOSED' = 'OPEN') => {
      const klass = await makeClass('FLOWER', [THUMB], `e2e ${key}`);
      classOf[key] = klass.id;
      await addSession(key, klass.id, startsAt, capacity, reserved, status);
    };

    await own('rem2', at(1 * HOUR), 8, 6); // 잔여 2 → 포함
    await own('ratio30', at(2 * HOUR), 10, 7); // 잔여 3 = 30% → 포함
    await own('ratio33', at(3 * HOUR), 9, 6); // 잔여 3 = 33% → 제외
    await own('ratio27', at(4 * HOUR), 11, 8); // 잔여 3 = 27% → 포함
    await own('soldOut', at(5 * HOUR), 6, 6); // 매진 → 제외
    await own('closed', at(6 * HOUR), 5, 4, 'CLOSED'); // CLOSED → 제외
    await own('startsNow', at(0), 8, 7); // 정확히 지금 → 제외
    await own('past', at(-1 * HOUR), 8, 7); // 지난 회차 → 제외
    await own('tieFlower', at(8 * HOUR), 4, 3); // 잔여 1, 같은 시각 → 포함
    await own('ratio30big', at(10 * HOUR), 20, 14); // 잔여 6 = 30% → 포함
    await own('ratio33big', at(11 * HOUR), 12, 8); // 잔여 4 = 33% → 제외
    await own('plenty', at(12 * HOUR), 3, 0); // 잔여 3 = 100% → 제외
    await own('windowEnd', at(7 * DAY), 8, 6); // 정확히 7일 뒤 → 포함
    await own('afterWindow', at(7 * DAY + 1), 8, 6); // 7일 + 1ms → 제외

    const scent = await makeClass('SCENT', []);
    classOf.tieScent = scent.id;
    await addSession('tieScent', scent.id, at(8 * HOUR), 4, 3); // 잔여 1, 같은 시각 → 포함

    // 조건 충족 회차가 여러 개인 클래스 → 가장 이른 1건만
    const multi = await makeClass('FLOWER', [THUMB], 'e2e 여러 회차');
    classOf.multiFirst = multi.id;
    await addSession('multiLater', multi.id, at(9 * HOUR), 8, 7);
    await addSession('multiFirst', multi.id, at(90 * 60 * 1000), 8, 6);
    await addSession('multiLast', multi.id, at(3 * DAY), 5, 4);
    await addSession('multiTooEarlyClosed', multi.id, at(30 * 60 * 1000), 5, 4, 'CLOSED');
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  const get = (query = '') => request(app.getHttpServer()).get(`/sessions/closing-soon${query ? `?${query}` : ''}`);
  const tie = () => [s.tieFlower, s.tieScent].sort();

  it('조건에 맞는 회차만 시작 오름차순(동률은 sessionId 오름차순)으로 준다', async () => {
    const res = await get().expect(200);
    const body = closingSoonResponseSchema.parse(res.body);

    expect(body.items.map((item) => item.sessionId)).toEqual([
      s.rem2,
      s.multiFirst,
      s.ratio30,
      s.ratio27,
      ...tie(),
      s.ratio30big,
      s.windowEnd,
    ]);
  });

  it('한 클래스에 조건 회차가 여러 개여도 가장 이른 1건만, 클래스는 한 번만 나온다', async () => {
    const body = closingSoonResponseSchema.parse((await get('limit=20').expect(200)).body);
    const classIds = body.items.map((item) => item.class.id);

    expect(new Set(classIds).size).toBe(classIds.length);
    const multi = body.items.filter((item) => item.class.id === classOf.multiFirst);
    expect(multi.map((item) => item.sessionId)).toEqual([s.multiFirst]);
    expect(body.items.map((item) => item.sessionId)).not.toContain(s.multiLater);
    expect(body.items.map((item) => item.sessionId)).not.toContain(s.multiLast);
  });

  it('reserved가 capacity를 넘는 회차는 DB CHECK가 막아서 만들어지지 않는다', async () => {
    const klass = await prisma.class.findFirstOrThrow({ where: { hostId } });
    await expect(
      prisma.classSession.create({
        data: { classId: klass.id, startsAt: new Date(NOW.getTime() + HOUR), endsAt: new Date(NOW.getTime() + 2 * HOUR), capacity: 4, reserved: 5 },
      }),
    ).rejects.toThrow();
  });

  it('회차 카드에 잔여·정원과 클래스 요약이 들어간다', async () => {
    const body = closingSoonResponseSchema.parse((await get().expect(200)).body);
    const byId = new Map(body.items.map((item) => [item.sessionId, item]));

    expect(byId.get(s.rem2)).toEqual({
      sessionId: s.rem2,
      startsAt: new Date(NOW.getTime() + HOUR).toISOString(),
      capacity: 8,
      remaining: 2,
      class: {
        id: classOf.rem2,
        title: 'e2e rem2',
        category: 'FLOWER',
        neighborhood: '성수동',
        price: 42000,
        durationMinutes: 90,
        thumbnailUrl: THUMB,
      },
    });
    expect(byId.get(s.tieScent)?.class).toMatchObject({ category: 'SCENT', thumbnailUrl: null });
    expect(byId.get(s.ratio30big)).toMatchObject({ capacity: 20, remaining: 6 });
  });

  it('limit만큼만 앞에서부터 준다', async () => {
    const body = closingSoonResponseSchema.parse((await get('limit=3').expect(200)).body);
    expect(body.items.map((item) => item.sessionId)).toEqual([s.rem2, s.multiFirst, s.ratio30]);
  });

  it('category를 주면 그 카테고리 클래스의 회차만 준다', async () => {
    const scent = closingSoonResponseSchema.parse((await get('category=SCENT').expect(200)).body);
    expect(scent.items.map((item) => item.sessionId)).toEqual([s.tieScent]);

    const flower = closingSoonResponseSchema.parse((await get('category=FLOWER').expect(200)).body);
    expect(flower.items.map((item) => item.sessionId)).toEqual([
      s.rem2,
      s.multiFirst,
      s.ratio30,
      s.ratio27,
      s.tieFlower,
      s.ratio30big,
      s.windowEnd,
    ]);
  });

  it('해당하는 회차가 없으면 200과 빈 목록', async () => {
    const body = closingSoonResponseSchema.parse((await get('category=COOKING').expect(200)).body);
    expect(body).toEqual({ items: [] });
  });

  it.each([
    ['limit=0'],
    ['limit=21'],
    ['limit=abc'],
    ['limit=1&limit=2'],
    ['category=flower'],
    ['category=FOO'],
    ['category=FLOWER&category=SCENT'],
  ])('%s 이면 400', async (query) => {
    const res = await get(query).expect(400);
    expect(apiErrorSchema.parse(res.body).statusCode).toBe(400);
  });
});
