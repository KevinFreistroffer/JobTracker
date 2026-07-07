import { prisma } from "@/lib/db";
import { suggestIsAiRole } from "@/lib/suggest-is-ai-role";
import { jobDescriptionInputSchema } from "@/lib/validations";

export type SaveJobDescriptionFromOpportunityInput = {
  opportunityId: string;
  companyName: string | null;
  roleTitle: string | null;
  jobDescription?: string | null;
  isAiRole?: boolean;
};

export async function saveJobDescriptionFromOpportunity({
  opportunityId,
  companyName,
  roleTitle,
  jobDescription,
  isAiRole,
}: SaveJobDescriptionFromOpportunityInput) {
  const body = jobDescription?.trim() ?? "";
  const company = companyName?.trim() ?? "";

  if (!body || !company) {
    return null;
  }

  const parsed = jobDescriptionInputSchema.safeParse({
    companyName: company,
    roleTitle: roleTitle ?? undefined,
    body,
    isAiRole:
      isAiRole ??
      suggestIsAiRole(roleTitle, body),
  });

  if (!parsed.success) {
    return null;
  }

  return prisma.jobDescription.create({
    data: {
      ...parsed.data,
      opportunityId,
    },
  });
}
