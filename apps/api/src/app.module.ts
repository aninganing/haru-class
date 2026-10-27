import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { type Env, validateEnv } from './config/env';
import { HealthController } from './modules/health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // 큐(예약 홀드 만료, 알림 등)는 도메인 모듈에서 BullModule.registerQueue로 등록한다.
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const url = new URL(config.get('REDIS_URL'));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            username: url.username || undefined,
            password: url.password || undefined,
          },
        };
      },
    }),
    PrismaModule,
    RedisModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
})
export class AppModule {}
