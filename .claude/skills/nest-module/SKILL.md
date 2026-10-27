---
name: nest-module
description: haru-class apps/api에 NestJS 도메인 모듈(컨트롤러·서비스·큐 프로세서)과 테스트를 작성하는 규칙과 템플릿. api 코드를 새로 쓰거나 고칠 때 사용한다.
---

# Nest 도메인 모듈 작성 규칙

## 파일 구조

```
apps/api/src/modules/<domain>/
├─ <domain>.module.ts
├─ <domain>.controller.ts
├─ <domain>.service.ts
├─ <domain>.mapper.ts          # Prisma row → contracts 타입 (Date → ISO 문자열)
├─ <domain>.processor.ts       # BullMQ 작업이 있을 때
└─ <domain>.service.spec.ts    # 단위 테스트 (같은 폴더)
apps/api/test/<domain>.e2e-spec.ts   # HTTP 경로 검증
```

새 모듈은 `src/app.module.ts`의 `imports`에 추가한다.

## 기본 템플릿

```ts
// <domain>.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { createThingSchema } from '@haru/contracts';
import { createZodDto } from 'nestjs-zod';
import { ThingsService } from './things.service';

class CreateThingDto extends createZodDto(createThingSchema) {}

@Controller('things')
export class ThingsController {
  constructor(private readonly things: ThingsService) {}

  @Post()
  create(@Body() body: CreateThingDto) {
    return this.things.create(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.things.findOne(id);
  }
}
```

- 입력 검증은 전역 `ZodValidationPipe`가 한다. DTO는 contracts 스키마로 `createZodDto`만 한다. class-validator는 쓰지 않는다.
- 서비스 메서드의 반환 타입은 contracts 타입으로 명시한다 (`Promise<Thing>`). Prisma row를 그대로 반환하지 않는다.
- 에러: 없음 → `NotFoundException`, 상태 충돌/정원 초과 → `ConflictException`, 잘못된 요청 → `BadRequestException`. 메시지는 사용자에게 보여줄 한국어 문장.

## Prisma

- 스키마: `apps/api/prisma/schema.prisma`. 모델은 PascalCase, 테이블/컬럼은 `@@map`/`@map`으로 snake_case, 시간은 `@db.Timestamptz`.
- 클라이언트 import: `import { ... } from '../../generated/prisma/client'` (Prisma 7 `prisma-client` 생성기, CJS).
- `PrismaService`는 전역 모듈이라 주입만 하면 된다.
- 마이그레이션: `pnpm --filter @haru/api prisma:migrate --name <설명>`.

## 동시성과 멱등성 (예약 도메인에서 특히 중요)

- 정원 같은 카운터는 **읽고 나서 쓰지 않는다**. 조건부 UPDATE 한 문장으로 처리하고 영향받은 행 수로 성공을 판단한다.

  ```ts
  const updated = await tx.$executeRaw`
    UPDATE class_sessions SET reserved = reserved + ${n}
    WHERE id = ${id} AND status = 'OPEN' AND reserved + ${n} <= capacity`;
  if (updated === 0) throw new ConflictException('남은 좌석이 부족해요');
  ```

- 상태 전이는 `updateMany({ where: { id, status: { in: from } } })`로 하고 `count === 0`이면 이미 처리된 것으로 본다. 같은 작업이 두 번 실행돼도 좌석이 두 번 반환되면 안 된다.
- BullMQ: 큐 이름·작업 이름은 상수로 둔다. `jobId`로 중복을 막는다 (`expire-${id}` — `:`은 BullMQ custom id에 쓸 수 없다). 큐는 모듈에서 `BullModule.registerQueue({ name })`로 등록한다 (연결은 AppModule에 이미 있다).
- 폴링되는 조회는 가볍게: 필요한 필드만 select하고, 필요하면 Redis에 짧은 TTL로 캐시한 뒤 쓰기 시점에 무효화한다 (`REDIS` 토큰 주입).

## 테스트

단위 테스트는 Nest `Test.createTestingModule`에 Prisma·Redis·큐를 `vi.fn()` 객체로 주입한다. 예: `src/modules/health/health.controller.spec.ts`.

```ts
const moduleRef = await Test.createTestingModule({
  providers: [
    ThingsService,
    { provide: PrismaService, useValue: { thing: { findUnique: vi.fn() } } },
    { provide: getQueueToken(THING_QUEUE), useValue: { add: vi.fn() } },
  ],
}).compile();
```

- 성공 경로와 **실패 경로**(없음, 충돌, 중복 실행)를 모두 테스트한다.
- e2e(`test/*.e2e-spec.ts`)는 `AppModule` 전체를 띄워 supertest로 호출하고, 응답을 contracts 스키마로 `parse`해 계약을 검증한다. 실제 DB를 쓰므로 테스트 데이터는 테스트 안에서 만들고 지운다.
- Vitest + SWC(`vitest.config.ts`)라 데코레이터 메타데이터가 동작한다. `globals`는 꺼져 있으니 `vitest`에서 import한다.
