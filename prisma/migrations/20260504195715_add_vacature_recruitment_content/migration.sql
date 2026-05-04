-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('NONE', 'PENDING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "Vacature" ADD COLUMN     "contentStatus" "ContentStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "recruiterInput" TEXT,
ADD COLUMN     "vacatureTekst" TEXT,
ADD COLUMN     "werkenbijUrl" TEXT;

-- CreateTable
CREATE TABLE "VacatureContent" (
    "id" TEXT NOT NULL,
    "vacatureId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "analysisJson" JSONB,
    "booleanNiche" TEXT,
    "booleanMedium" TEXT,
    "booleanBreed" TEXT,
    "doorgroeiNiche" TEXT,
    "doorgroeiBreed" TEXT,
    "inmailOpenToWork" TEXT,
    "inmailNietOpen" TEXT,
    "scope" TEXT NOT NULL,
    "inputSource" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "VacatureContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VacatureContent_vacatureId_version_idx" ON "VacatureContent"("vacatureId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "VacatureContent_vacatureId_version_key" ON "VacatureContent"("vacatureId", "version");

-- AddForeignKey
ALTER TABLE "VacatureContent" ADD CONSTRAINT "VacatureContent_vacatureId_fkey" FOREIGN KEY ("vacatureId") REFERENCES "Vacature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacatureContent" ADD CONSTRAINT "VacatureContent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
