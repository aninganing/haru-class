-- 클래스 카탈로그 상세 필드 (직접 작성: 기존 행 처리와 thumbnail_url → images 이관이 필요해서)

-- CreateEnum
CREATE TYPE "class_category" AS ENUM ('CRAFT', 'COOKING', 'DRAWING', 'FLOWER', 'SCENT');

-- CreateEnum
CREATE TYPE "class_difficulty" AS ENUM ('INTRO', 'BEGINNER', 'INTERMEDIATE');

-- AlterTable: 새 컬럼. 기존 행 때문에 NOT NULL 컬럼은 임시 DEFAULT로 추가한다.
ALTER TABLE "classes"
ADD COLUMN "category" "class_category" NOT NULL DEFAULT 'CRAFT',
ADD COLUMN "difficulty" "class_difficulty" NOT NULL DEFAULT 'INTRO',
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "neighborhood" TEXT NOT NULL DEFAULT '',
ADD COLUMN "location_note" TEXT NOT NULL DEFAULT '',
ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "learnings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "curriculum" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "inclusions" TEXT NOT NULL DEFAULT '';

-- 데이터 이관: 대표 이미지를 images[0]으로
UPDATE "classes" SET "images" = ARRAY["thumbnail_url"] WHERE "thumbnail_url" IS NOT NULL;

-- 임시 DEFAULT 제거 (배열·curriculum의 기본값은 스키마에 있으므로 유지)
ALTER TABLE "classes"
ALTER COLUMN "category" DROP DEFAULT,
ALTER COLUMN "difficulty" DROP DEFAULT,
ALTER COLUMN "neighborhood" DROP DEFAULT,
ALTER COLUMN "location_note" DROP DEFAULT,
ALTER COLUMN "inclusions" DROP DEFAULT;

-- AlterTable: 썸네일은 images[0]에서 파생한다
ALTER TABLE "classes" DROP COLUMN "thumbnail_url";

-- AddCheckConstraint
ALTER TABLE "classes" ADD CONSTRAINT "classes_images_max_6" CHECK (cardinality("images") <= 6);
ALTER TABLE "classes" ADD CONSTRAINT "classes_curriculum_is_array" CHECK (jsonb_typeof("curriculum") = 'array');

-- CreateIndex
CREATE INDEX "classes_category_created_at_id_idx" ON "classes"("category", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "class_sessions_status_starts_at_idx" ON "class_sessions"("status", "starts_at");
