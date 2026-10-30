import { Controller, Get, Query } from '@nestjs/common';
import { type ClosingSoonResponse, closingSoonQuerySchema } from '@haru/contracts';
import { createZodDto } from 'nestjs-zod';
import { SessionsService } from './sessions.service';

class ClosingSoonQueryDto extends createZodDto(closingSoonQuerySchema) {}

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  // 나중에 `:id` 경로가 생기면 이 정적 경로보다 아래에 둔다.
  @Get('closing-soon')
  closingSoon(@Query() query: ClosingSoonQueryDto): Promise<ClosingSoonResponse> {
    return this.sessions.closingSoon(query);
  }
}
