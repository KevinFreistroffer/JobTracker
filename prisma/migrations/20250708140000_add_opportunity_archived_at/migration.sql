-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Opportunity_archivedAt_idx" ON "Opportunity"("archivedAt");
