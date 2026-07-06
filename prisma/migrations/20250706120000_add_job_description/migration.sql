-- CreateTable
CREATE TABLE "JobDescription" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "roleTitle" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);
