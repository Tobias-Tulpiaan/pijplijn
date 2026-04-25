-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedNote" TEXT,
ADD COLUMN     "archivedReason" TEXT;
