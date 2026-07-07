import { afterEach, describe, expect, it, vi } from "vitest";
import { saveJobDescriptionFromOpportunity } from "@/lib/save-job-description-from-opportunity";

const prismaMock = vi.hoisted(() => ({
  jobDescription: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("saveJobDescriptionFromOpportunity", () => {
  it("creates a job description when company and body are provided", async () => {
    prismaMock.jobDescription.create.mockResolvedValue({
      id: "jd-1",
      companyName: "Acme",
      roleTitle: "AI Lead",
      body: "Own LLM deployment.",
      isAiRole: true,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    });

    const result = await saveJobDescriptionFromOpportunity({
      opportunityId: "opp-1",
      companyName: "Acme",
      roleTitle: "AI Lead",
      jobDescription: "Own LLM deployment.",
      isAiRole: true,
    });

    expect(result).toMatchObject({ companyName: "Acme", isAiRole: true });
    expect(prismaMock.jobDescription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        opportunityId: "opp-1",
        companyName: "Acme",
        roleTitle: "AI Lead",
        body: "Own LLM deployment.",
        isAiRole: true,
      }),
    });
  });

  it("skips saving when job description text is missing", async () => {
    const result = await saveJobDescriptionFromOpportunity({
      opportunityId: "opp-1",
      companyName: "Acme",
      roleTitle: "Engineer",
      jobDescription: "",
    });

    expect(result).toBeNull();
    expect(prismaMock.jobDescription.create).not.toHaveBeenCalled();
  });

  it("skips saving when company name is missing", async () => {
    const result = await saveJobDescriptionFromOpportunity({
      opportunityId: "opp-1",
      companyName: null,
      roleTitle: "Engineer",
      jobDescription: "Build APIs.",
    });

    expect(result).toBeNull();
    expect(prismaMock.jobDescription.create).not.toHaveBeenCalled();
  });
});
