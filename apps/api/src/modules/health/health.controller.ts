import { Controller, Get, Inject } from '@nestjs/common';
import type { Health } from '@haru/contracts';
import type Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS } from '../../redis/redis.module';

const probe = (check: Promise<unknown>) =>
  check.then(() => 'up' as const).catch(() => 'down' as const);

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  async check(): Promise<Health> {
    const [database, redis] = await Promise.all([
      probe(this.prisma.$queryRaw`SELECT 1`),
      probe(this.redis.ping()),
    ]);
    return {
      status: database === 'up' && redis === 'up' ? 'ok' : 'degraded',
      checks: { database, redis },
    };
  }
}
