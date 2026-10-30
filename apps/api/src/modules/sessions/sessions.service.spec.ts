import { Test } from '@nestjs/testing';
import {
  CLOSING_SOON_MAX_RATIO,
  CLOSING_SOON_MAX_REMAINING,
  CLOSING_SOON_WINDOW_DAYS,
} from '@haru/contracts';
import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CLOCK } from '../../common/clock';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionsService } from './sessions.service';

const NOW = new Date('2026-10-27T03:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

/** tagged template 호출에서 SQL 텍스트와 바인딩 값을 꺼낸다 (Prisma.sql 조각도 펼친다) */
function sqlOf(call: unknown[]) {
  const [strings, ...values] = call as [TemplateStringsArray, ...unknown[]];
  const flat: unknown[] = [];
  let text = strings[0];
  values.forEach((value, i) => {
    if (value && typeof value === 'object' && 'strings' in value && 'values' in value) {
      const fragment = value as { strings: string[]; values: unknown[] };
      text += fragment.strings.join('?');
      flat.push(...fragment.values);
    } else {
      text += '?';
      flat.push(value);
    }
    text += strings[i + 1];
  });
  return { text: text.replace(/\s+/g, ' '), values: flat };
}

const row = (overrides: Record<string, unknown> = {}) => ({
  sessionId: 'ses1',
  startsAt: new Date('2026-10-28T05:00:00.000Z'),
  capacity: 8,
  remaining: 2,
  classId: 'cls1',
  title: '도자기 물레 체험',
  category: 'CRAFT',
  neighborhood: '익선동',
  price: 55000,
  durationMinutes: 150,
  images: ['https://picsum.photos/seed/1/960/640'],
  ...overrides,
});

describe('SessionsService.closingSoon', () => {
  const prisma = { $queryRaw: vi.fn() };
  let service: SessionsService;

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.$queryRaw.mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CLOCK, useValue: () => NOW },
      ],
    }).compile();
    service = moduleRef.get(SessionsService);
  });

  it('지금부터 7일 끝(포함)까지, 잔여 2석 이하 또는 30% 이하, limit을 바인딩해서 한 번 조회한다', async () => {
    await service.closingSoon({ limit: 7 });

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    const { text, values } = sqlOf(prisma.$queryRaw.mock.calls[0]);
    expect(values).toEqual([
      NOW,
      new Date(NOW.getTime() + CLOSING_SOON_WINDOW_DAYS * DAY),
      CLOSING_SOON_MAX_REMAINING,
      String(CLOSING_SOON_MAX_RATIO),
      7,
    ]);
    expect(text).toContain("s.status = 'OPEN'");
    expect(text).toContain('s.starts_at > ? AND s.starts_at <= ?');
    expect(text).toContain('s.reserved < s.capacity');
    expect(text).toContain('?::numeric');
    expect(text).toContain('SELECT DISTINCT ON (c.id)');
    expect(text).toContain('ORDER BY c.id, s.starts_at ASC, s.id ASC');
    expect(text).toContain('ORDER BY "startsAt" ASC, "sessionId" ASC LIMIT ?');
    expect(text).not.toContain('c.category =');
  });

  it('category를 주면 클래스 카테고리 조건을 바인딩 값으로 더한다', async () => {
    await service.closingSoon({ limit: 10, category: 'FLOWER' });

    const { text, values } = sqlOf(prisma.$queryRaw.mock.calls[0]);
    expect(text).toContain('AND c.category = ?::class_category');
    expect(values).toContain('FLOWER');
    expect(values.at(-1)).toBe(10);
  });

  it('결과가 없으면 빈 목록', async () => {
    await expect(service.closingSoon({ limit: 10 })).resolves.toEqual({ items: [] });
  });

  it('행을 회차 카드 형태로 바꾸고 시간은 UTC ISO 문자열, 썸네일은 첫 번째 유효 URL', async () => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    prisma.$queryRaw.mockResolvedValue([row(), row({ sessionId: 'ses2', classId: 'cls2', images: [], remaining: 1 }),
      row({ sessionId: 'ses3', classId: 'cls3', images: ['broken', 'https://picsum.photos/seed/3/960/640'] })]);

    const res = await service.closingSoon({ limit: 10 });

    expect(res.items[0]).toEqual({
      sessionId: 'ses1',
      startsAt: '2026-10-28T05:00:00.000Z',
      capacity: 8,
      remaining: 2,
      class: {
        id: 'cls1',
        title: '도자기 물레 체험',
        category: 'CRAFT',
        neighborhood: '익선동',
        price: 55000,
        durationMinutes: 150,
        thumbnailUrl: 'https://picsum.photos/seed/1/960/640',
      },
    });
    expect(res.items[1]).toMatchObject({ sessionId: 'ses2', remaining: 1, class: { thumbnailUrl: null } });
    expect(res.items[2].class.thumbnailUrl).toBe('https://picsum.photos/seed/3/960/640');
  });
});
