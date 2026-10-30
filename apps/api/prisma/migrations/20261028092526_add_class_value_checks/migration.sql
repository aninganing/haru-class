-- 클래스 값 범위 제약 (Prisma 스키마로 표현할 수 없어 직접 작성)
ALTER TABLE "classes" ADD CONSTRAINT "classes_price_nonnegative" CHECK ("price" >= 0);
ALTER TABLE "classes" ADD CONSTRAINT "classes_duration_positive" CHECK ("duration_minutes" > 0);
