-- AlterTable
ALTER TABLE "JobDescription" ADD COLUMN "opportunityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "JobDescription_opportunityId_key" ON "JobDescription"("opportunityId");

-- AddForeignKey
ALTER TABLE "JobDescription" ADD CONSTRAINT "JobDescription_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
