import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { healthSchema } from '@haru/contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';

describe('GET /health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('응답이 contracts의 healthSchema를 만족한다', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(healthSchema.parse(res.body)).toEqual({
      status: 'ok',
      checks: { database: 'up', redis: 'up' },
    });
  });
});
