-- AlterTable
ALTER TABLE "JobDescription" ADD COLUMN "isAiRole" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AiRequirement" (
    "id" TEXT NOT NULL,
    "canonicalText" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRequirementOccurrence" (
    "id" TEXT NOT NULL,
    "aiRequirementId" TEXT NOT NULL,
    "jobDescriptionId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRequirementOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDescriptionAiExtraction" (
    "jobDescriptionId" TEXT NOT NULL,
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobDescriptionAiExtraction_pkey" PRIMARY KEY ("jobDescriptionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiRequirementOccurrence_aiRequirementId_jobDescriptionId_rawText_key" ON "AiRequirementOccurrence"("aiRequirementId", "jobDescriptionId", "rawText");

-- AddForeignKey
ALTER TABLE "AiRequirementOccurrence" ADD CONSTRAINT "AiRequirementOccurrence_aiRequirementId_fkey" FOREIGN KEY ("aiRequirementId") REFERENCES "AiRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRequirementOccurrence" ADD CONSTRAINT "AiRequirementOccurrence_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDescriptionAiExtraction" ADD CONSTRAINT "JobDescriptionAiExtraction_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
