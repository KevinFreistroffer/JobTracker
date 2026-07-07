import { prisma } from "@/lib/db";
import {
  extractAiRequirementsFromJobDescription,
  type ExtractedAiRequirement,
} from "@/lib/ai-requirement-extract";
import { mergeAiRequirements } from "@/lib/ai-requirement-merge";

const EXTRACTION_CONCURRENCY = 3;

export type PersistAiRequirementsInput = {
  apiKey: string;
  force?: boolean;
};

export type PersistAiRequirementsResult = {
  processedJobDescriptionCount: number;
  newRequirementCount: number;
  totalCanonicalCount: number;
};

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
}

function flattenExtractedRequirements(
  jobDescriptionId: string,
  requirements: ExtractedAiRequirement[],
) {
  return requirements.map((requirement) => ({
    jobDescriptionId,
    rawText: requirement.text,
  }));
}

export async function persistAiRequirementsFromAiJds({
  apiKey,
  force = false,
}: PersistAiRequirementsInput): Promise<PersistAiRequirementsResult> {
  const aiJobDescriptions = await prisma.jobDescription.findMany({
    where: { isAiRole: true },
    orderBy: { createdAt: "asc" },
  });

  if (aiJobDescriptions.length === 0) {
    return {
      processedJobDescriptionCount: 0,
      newRequirementCount: 0,
      totalCanonicalCount: await prisma.aiRequirement.count(),
    };
  }

  const extractedJobDescriptionIds = new Set(
    (
      await prisma.jobDescriptionAiExtraction.findMany({
        select: { jobDescriptionId: true },
      })
    ).map((record) => record.jobDescriptionId),
  );

  const jobDescriptionsToProcess = force
    ? aiJobDescriptions
    : aiJobDescriptions.filter(
        (jobDescription) => !extractedJobDescriptionIds.has(jobDescription.id),
      );

  if (jobDescriptionsToProcess.length === 0) {
    return {
      processedJobDescriptionCount: 0,
      newRequirementCount: 0,
      totalCanonicalCount: await prisma.aiRequirement.count(),
    };
  }

  if (force) {
    const jobDescriptionIds = jobDescriptionsToProcess.map(
      (jobDescription) => jobDescription.id,
    );
    await prisma.aiRequirementOccurrence.deleteMany({
      where: { jobDescriptionId: { in: jobDescriptionIds } },
    });
    await prisma.jobDescriptionAiExtraction.deleteMany({
      where: { jobDescriptionId: { in: jobDescriptionIds } },
    });
  }

  const extractionResults = await mapWithConcurrency(
    jobDescriptionsToProcess,
    EXTRACTION_CONCURRENCY,
    async (jobDescription) => {
      const extracted = await extractAiRequirementsFromJobDescription(
        {
          companyName: jobDescription.companyName,
          roleTitle: jobDescription.roleTitle,
          jobDescriptionId: jobDescription.id,
          body: jobDescription.body,
        },
        apiKey,
      );

      return {
        jobDescriptionId: jobDescription.id,
        requirements: extracted.requirements,
      };
    },
  );

  const newRequirements = extractionResults.flatMap((result) =>
    flattenExtractedRequirements(
      result.jobDescriptionId,
      result.requirements,
    ),
  );

  if (newRequirements.length > 0) {
    const existingRequirements = await prisma.aiRequirement.findMany({
      orderBy: { createdAt: "asc" },
    });

    const mergeResult = await mergeAiRequirements(
      {
        existingRequirements: existingRequirements.map((requirement) => ({
          id: requirement.id,
          canonicalText: requirement.canonicalText,
          category: requirement.category,
        })),
        newRequirements,
      },
      apiKey,
    );

    for (const group of mergeResult.groups) {
      let aiRequirement = await prisma.aiRequirement.findFirst({
        where: {
          canonicalText: group.canonicalText,
        },
      });

      if (!aiRequirement) {
        aiRequirement = await prisma.aiRequirement.create({
          data: {
            canonicalText: group.canonicalText,
            category: group.category ?? null,
          },
        });
      } else if (group.category && !aiRequirement.category) {
        aiRequirement = await prisma.aiRequirement.update({
          where: { id: aiRequirement.id },
          data: { category: group.category },
        });
      }

      for (const member of group.members) {
        await prisma.aiRequirementOccurrence.upsert({
          where: {
            aiRequirementId_jobDescriptionId_rawText: {
              aiRequirementId: aiRequirement.id,
              jobDescriptionId: member.jobDescriptionId,
              rawText: member.rawText,
            },
          },
          create: {
            aiRequirementId: aiRequirement.id,
            jobDescriptionId: member.jobDescriptionId,
            rawText: member.rawText,
          },
          update: {},
        });
      }
    }
  }

  for (const result of extractionResults) {
    await prisma.jobDescriptionAiExtraction.upsert({
      where: { jobDescriptionId: result.jobDescriptionId },
      create: { jobDescriptionId: result.jobDescriptionId },
      update: { extractedAt: new Date() },
    });
  }

  return {
    processedJobDescriptionCount: jobDescriptionsToProcess.length,
    newRequirementCount: newRequirements.length,
    totalCanonicalCount: await prisma.aiRequirement.count(),
  };
}

export type SerializedAiRequirement = {
  id: string;
  canonicalText: string;
  category: string | null;
  occurrenceCount: number;
  jobDescriptions: Array<{
    id: string;
    companyName: string;
    roleTitle: string | null;
    rawText: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export async function listSerializedAiRequirements(): Promise<
  SerializedAiRequirement[]
> {
  const requirements = await prisma.aiRequirement.findMany({
    include: {
      occurrences: {
        include: {
          jobDescription: {
            select: {
              id: true,
              companyName: true,
              roleTitle: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const serialized = requirements.map((requirement) => ({
    id: requirement.id,
    canonicalText: requirement.canonicalText,
    category: requirement.category,
    occurrenceCount: requirement.occurrences.length,
    jobDescriptions: requirement.occurrences.map((occurrence) => ({
      id: occurrence.jobDescription.id,
      companyName: occurrence.jobDescription.companyName,
      roleTitle: occurrence.jobDescription.roleTitle,
      rawText: occurrence.rawText,
    })),
    createdAt: requirement.createdAt.toISOString(),
    updatedAt: requirement.updatedAt.toISOString(),
  }));

  return serialized.sort((a, b) => b.occurrenceCount - a.occurrenceCount);
}

export async function getStudySubjectRequirements(): Promise<
  Array<{
    canonicalText: string;
    occurrenceCount: number;
    category: string | null;
  }>
> {
  const requirements = await listSerializedAiRequirements();
  return requirements.map((requirement) => ({
    canonicalText: requirement.canonicalText,
    occurrenceCount: requirement.occurrenceCount,
    category: requirement.category,
  }));
}
