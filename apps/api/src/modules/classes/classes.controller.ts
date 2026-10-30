import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  type ClassDetail,
  type ClassListResponse,
  classIdParamSchema,
  classListQuerySchema,
} from '@haru/contracts';
import { createZodDto } from 'nestjs-zod';
import { ClassesService } from './classes.service';

class ClassListQueryDto extends createZodDto(classListQuerySchema) {}
class ClassIdParamDto extends createZodDto(classIdParamSchema) {}

@Controller('classes')
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}

  @Get()
  list(@Query() query: ClassListQueryDto): Promise<ClassListResponse> {
    return this.classes.list(query);
  }

  @Get(':id')
  findOne(@Param() { id }: ClassIdParamDto): Promise<ClassDetail> {
    return this.classes.findOne(id);
  }
}
