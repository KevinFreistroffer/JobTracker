-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN "interviewAt" TIMESTAMP(3),
ADD COLUMN "interviewReminderEnabled" BOOLEAN NOT NULL DEFAULT false;
