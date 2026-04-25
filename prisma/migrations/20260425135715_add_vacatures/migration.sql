-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "vacatureId" TEXT;

-- CreateTable
CREATE TABLE "Vacature" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    "consultantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "positions" INTEGER NOT NULL DEFAULT 1,
    "contractType" TEXT,
    "hoursPerWeek" INTEGER,
    "location" TEXT,
    "workModel" TEXT,
    "salaryMonthMin" INTEGER,
    "salaryMonthMax" INTEGER,
    "salaryYearMin" INTEGER,
    "salaryYearMax" INTEGER,
    "bonus" TEXT,
    "leaseAuto" TEXT,
    "pensionExtras" TEXT,
    "feeOpdrachtgever" INTEGER,
    "description" TEXT,
    "highlights" TEXT,
    "notes" TEXT,
    "deadline" TIMESTAMP(3),
    "isAlgemeen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vacature_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_vacatureId_fkey" FOREIGN KEY ("vacatureId") REFERENCES "Vacature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacature" ADD CONSTRAINT "Vacature_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacature" ADD CONSTRAINT "Vacature_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacature" ADD CONSTRAINT "Vacature_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
