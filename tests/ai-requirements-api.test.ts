import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as listAiRequirements } from "@/app/api/ai-requirements/route";
import { POST as extractAiRequirements } from "@/app/api/ai-requirements/extract/route";
import { POST as generateStudySubjects } from "@/app/api/ai-requirements/study-subjects/route";
import * as aiRequirementsService from "@/lib/ai-requirements-service";
import * as aiStudySubjects from "@/lib/ai-study-subjects";
import * as openAiApiKey from "@/lib/openai-api-key";

const prismaMock = vi.hoisted(() => ({
  jobDescription: {
    findMany: vi.fn(),
  },
  aiRequirement: {
    count: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AI requirements API", () => {
  it("lists serialized AI requirements", async () => {
    vi.spyOn(aiRequirementsService, "listSerializedAiRequirements").mockResolvedValue(
      [
        {
          id: "req-1",
          canonicalText: "AI governance experience",
          category: "governance",
          occurrenceCount: 2,
          jobDescriptions: [
            {
              id: "jd-1",
              companyName: "Acme",
              roleTitle: "AI Lead",
              rawText: "AI governance",
            },
          ],
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    );

    const response = await listAiRequirements();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toHaveLength(1);
  });

  it("extracts AI requirements from flagged JDs", async () => {
    vi.spyOn(openAiApiKey, "getOpenAiApiKey").mockReturnValue("test-api-key");
    vi.spyOn(
      aiRequirementsService,
      "persistAiRequirementsFromAiJds",
    ).mockResolvedValue({
      processedJobDescriptionCount: 2,
      newRequirementCount: 5,
      totalCanonicalCount: 4,
    });

    const response = await extractAiRequirements(
      new Request("http://localhost/api/ai-requirements/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      processedJobDescriptionCount: 2,
      newRequirementCount: 5,
      totalCanonicalCount: 4,
    });
  });

  it("requires OpenAI for extraction", async () => {
    vi.spyOn(openAiApiKey, "getOpenAiApiKey").mockReturnValue(undefined);

    const response = await extractAiRequirements(
      new Request("http://localhost/api/ai-requirements/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(500);
  });

  it("generates study subjects from stored requirements", async () => {
    vi.spyOn(openAiApiKey, "getOpenAiApiKey").mockReturnValue("test-api-key");
    vi.spyOn(
      aiRequirementsService,
      "getStudySubjectRequirements",
    ).mockResolvedValue([
      {
        canonicalText: "AI governance experience",
        occurrenceCount: 2,
        category: "governance",
      },
    ]);
    vi.spyOn(aiStudySubjects, "generateAiStudySubjects").mockResolvedValue({
      subjects: [
        {
          name: "AI Governance",
          rationale: "Common across AI roles.",
          relatedRequirements: ["AI governance experience"],
          priority: "high",
        },
      ],
    });

    const response = await generateStudySubjects();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      subjects: [
        {
          name: "AI Governance",
          rationale: "Common across AI roles.",
          relatedRequirements: ["AI governance experience"],
          priority: "high",
        },
      ],
    });
  });

  it("requires extracted requirements before study subjects", async () => {
    vi.spyOn(openAiApiKey, "getOpenAiApiKey").mockReturnValue("test-api-key");
    vi.spyOn(
      aiRequirementsService,
      "getStudySubjectRequirements",
    ).mockResolvedValue([]);

    const response = await generateStudySubjects();

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("No AI requirements found");
  });
});
