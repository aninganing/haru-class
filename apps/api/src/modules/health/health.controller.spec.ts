import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS } from '../../redis/redis.module';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const prisma = { $queryRaw: vi.fn() };
  const redis = { ping: vi.fn() };
  let controller: HealthController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: REDIS, useValue: redis },
      ],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('DB와 Redis가 모두 응답하면 ok', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.ping.mockResolvedValue('PONG');

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      checks: { database: 'up', redis: 'up' },
    });
  });

  it('하나라도 실패하면 degraded이고 실패한 쪽만 down', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    redis.ping.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(controller.check()).resolves.toEqual({
      status: 'degraded',
      checks: { database: 'up', redis: 'down' },
    });
  });
});
