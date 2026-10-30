-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "thumbnail_url" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_sessions" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "status" "session_status" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "classes_created_at_id_idx" ON "classes"("created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "classes_host_id_idx" ON "classes"("host_id");

-- CreateIndex
CREATE INDEX "class_sessions_class_id_starts_at_idx" ON "class_sessions"("class_id", "starts_at");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint (Prisma 스키마로 표현할 수 없어 직접 추가)
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_capacity_positive" CHECK ("capacity" > 0);
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_reserved_nonnegative" CHECK ("reserved" >= 0);
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_reserved_within_capacity" CHECK ("reserved" <= "capacity");
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_ends_after_starts" CHECK ("ends_at" > "starts_at");
