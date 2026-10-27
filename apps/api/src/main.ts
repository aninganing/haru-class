import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import type { Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  // 브라우저는 Next의 /api 프록시를 거쳐 들어오므로 CORS를 열지 않는다.
  const port = app.get(ConfigService<Env, true>).get('PORT', { infer: true });
  await app.listen(port);
}

void bootstrap();
