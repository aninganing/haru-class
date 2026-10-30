import type { ClassCategory, ClosingSoonItem } from '@haru/contracts';
import { sanitizeImages } from '../classes/classes.mapper';

/** closing-soon raw 쿼리 결과 한 행 */
export interface ClosingSoonRow {
  sessionId: string;
  startsAt: Date;
  capacity: number;
  remaining: number;
  classId: string;
  title: string;
  category: ClassCategory;
  neighborhood: string;
  price: number;
  durationMinutes: number;
  /** 대표 이미지는 URL로 검증된 첫 장 */
  images: string[];
}

export function toClosingSoonItem(row: ClosingSoonRow): ClosingSoonItem {
  return {
    sessionId: row.sessionId,
    startsAt: row.startsAt.toISOString(),
    capacity: row.capacity,
    remaining: row.remaining,
    class: {
      id: row.classId,
      title: row.title,
      category: row.category,
      neighborhood: row.neighborhood,
      price: row.price,
      durationMinutes: row.durationMinutes,
      thumbnailUrl: sanitizeImages(row.classId, row.images)[0] ?? null,
    },
  };
}
