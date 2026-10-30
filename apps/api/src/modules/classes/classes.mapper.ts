import { Logger } from '@nestjs/common';
import {
  type ClassCategory,
  type ClassDetail,
  type ClassDifficulty,
  type ClassSummary,
  type CurriculumItem,
  type SessionSummary,
  curriculumItemSchema,
  NEW_CLASS_DAYS,
} from '@haru/contracts';
import { z } from 'zod';

const DAY_MS = 24 * 60 * 60 * 1000;
const logger = new Logger('ClassesMapper');
const curriculumSchema = z.array(curriculumItemSchema);
const imageUrlSchema = z.url();

export interface ClassBaseRow {
  id: string;
  title: string;
  summary: string;
  category: ClassCategory;
  tags: string[];
  neighborhood: string;
  price: number;
  durationMinutes: number;
  images: string[];
}

export interface ClassSummaryRow extends ClassBaseRow {
  createdAt: Date;
}

export interface SessionRow {
  id: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  reserved: number;
}

export interface ClassDetailRow extends ClassBaseRow {
  description: string;
  difficulty: ClassDifficulty;
  location: string;
  locationNote: string;
  learnings: string[];
  curriculum: unknown;
  inclusions: string;
  host: { name: string };
  sessions: SessionRow[];
}

/** 목록 groupBy 결과: 예약 가능한 회차(미래·OPEN·잔여>0) 집계 */
export interface BookableAggregate {
  nextSessionAt: Date | null;
  maxCapacity: number | null;
}

/** text[]라 DB가 URL 형식을 보장하지 못한다. URL이 아닌 항목은 빼고 경고한다. 순서는 유지. */
export function sanitizeImages(classId: string, raw: string[]): string[] {
  const valid = raw.filter((value) => imageUrlSchema.safeParse(value).success);
  if (valid.length !== raw.length) {
    logger.warn(`클래스 ${classId}의 images 중 URL이 아닌 ${raw.length - valid.length}개를 빼고 응답합니다`);
  }
  return valid;
}

const toBase = (row: ClassBaseRow, images: string[], maxCapacity: number | null) => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  category: row.category,
  tags: row.tags,
  neighborhood: row.neighborhood,
  price: row.price,
  durationMinutes: row.durationMinutes,
  thumbnailUrl: images[0] ?? null,
  maxCapacity,
});

/** 생성 후 NEW_CLASS_DAYS일 이내(경계 포함) */
export const isNewClass = (createdAt: Date, now: Date): boolean =>
  createdAt.getTime() >= now.getTime() - NEW_CLASS_DAYS * DAY_MS;

export function toClassSummary(row: ClassSummaryRow, aggregate: BookableAggregate | undefined, now: Date): ClassSummary {
  return {
    ...toBase(row, sanitizeImages(row.id, row.images), aggregate?.maxCapacity ?? null),
    isNew: isNewClass(row.createdAt, now),
    nextSessionAt: aggregate?.nextSessionAt ? aggregate.nextSessionAt.toISOString() : null,
  };
}

const remainingOf = (row: SessionRow) => Math.max(row.capacity - row.reserved, 0);

/** DB status가 OPEN인 회차만 들어온다. 남은 좌석이 0이면 SOLD_OUT. */
export function toSessionSummary(row: SessionRow): SessionSummary {
  const remaining = remainingOf(row);
  return {
    id: row.id,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    capacity: row.capacity,
    remaining,
    status: remaining === 0 ? 'SOLD_OUT' : 'OPEN',
  };
}

/** jsonb라 DB가 항목 모양을 보장하지 못한다. 틀리면 상세 전체를 깨뜨리지 않고 경고 후 빈 배열. */
export function parseCurriculum(classId: string, raw: unknown): CurriculumItem[] {
  const parsed = curriculumSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(`클래스 ${classId}의 curriculum 형식이 올바르지 않아 빈 배열로 응답합니다`);
    return [];
  }
  return [...parsed.data].sort((a, b) => a.offsetMinutes - b.offsetMinutes);
}

export function toClassDetail(row: ClassDetailRow): ClassDetail {
  const bookable = row.sessions.filter((session) => remainingOf(session) > 0);
  const maxCapacity = bookable.length > 0 ? Math.max(...bookable.map((session) => session.capacity)) : null;
  const images = sanitizeImages(row.id, row.images);
  return {
    ...toBase(row, images, maxCapacity),
    description: row.description,
    difficulty: row.difficulty,
    location: row.location,
    locationNote: row.locationNote,
    images,
    learnings: row.learnings,
    curriculum: parseCurriculum(row.id, row.curriculum),
    inclusions: row.inclusions,
    host: { name: row.host.name },
    sessions: row.sessions.map(toSessionSummary),
  };
}
