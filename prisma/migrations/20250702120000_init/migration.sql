-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('EMAIL', 'CALL');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('NEW', 'RESPONDED', 'INTERVIEWING', 'INTERVIEWED', 'OFFER', 'REJECTED', 'NO_RESPONSE', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "contactType" "ContactType" NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'NEW',
    "recruiterName" TEXT NOT NULL,
    "recruiterEmail" TEXT,
    "companyName" TEXT NOT NULL,
    "roleTitle" TEXT,
    "contactDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);
