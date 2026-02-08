-- AlterTable
ALTER TABLE "Notice" ADD COLUMN     "targetInstitutionId" TEXT;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_targetInstitutionId_fkey" FOREIGN KEY ("targetInstitutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
