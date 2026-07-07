import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as createJobDescription } from "@/app/api/job-descriptions/route";
import { PATCH as patchJobDescription } from "@/app/api/job-descriptions/[id]/route";
import { POST as generateInsight } from "@/app/api/job-descriptions/insights/route";
import * as jdInsights from "@/lib/jd-insights";
import * as openAiApiKey from "@/lib/openai-api-key";

const prismaMock = vi.hoisted(() => ({
  jobDescription: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("job descriptions API", () => {
  it("returns validation errors for missing fields on create", async () => {
    const response = await createJobDescription(
      new Request("http://localhost/api/job-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: "", body: "" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
  });

  it("creates a saved job description", async () => {
    prismaMock.jobDescription.create.mockResolvedValue({
      id: "jd-1",
      companyName: "Medallion",
      roleTitle: "Senior Software Engineer",
      body: "Healthcare software role.",
      isAiRole: false,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    });

    const response = await createJobDescription(
      new Request("http://localhost/api/job-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Medallion",
          roleTitle: "Senior Software Engineer",
          body: "Healthcare software role.",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      companyName: "Medallion",
      roleTitle: "Senior Software Engineer",
      isAiRole: false,
    });
    expect(prismaMock.jobDescription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ isAiRole: false }),
    });
  });

  it("auto-suggests isAiRole when saving an AI-focused job description", async () => {
    prismaMock.jobDescription.create.mockResolvedValue({
      id: "jd-2",
      companyName: "Acme",
      roleTitle: "AI Platform Lead",
      body: "Own LLM deployment and governance.",
      isAiRole: true,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    });

    const response = await createJobDescription(
      new Request("http://localhost/api/job-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Acme",
          roleTitle: "AI Platform Lead",
          body: "Own LLM deployment and governance.",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(prismaMock.jobDescription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ isAiRole: true }),
    });
    await expect(response.json()).resolves.toMatchObject({ isAiRole: true });
  });

  it("patches the AI role flag on an existing job description", async () => {
    prismaMock.jobDescription.findUnique.mockResolvedValue({
      id: "jd-1",
      companyName: "Medallion",
      roleTitle: "Engineer",
      body: "Software role.",
      isAiRole: false,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    });
    prismaMock.jobDescription.update.mockResolvedValue({
      id: "jd-1",
      companyName: "Medallion",
      roleTitle: "Engineer",
      body: "Software role.",
      isAiRole: true,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z"),
    });

    const response = await patchJobDescription(
      new Request("http://localhost/api/job-descriptions/jd-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAiRole: true }),
      }),
      { params: Promise.resolve({ id: "jd-1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ isAiRole: true });
  });
});

describe("job descriptions insights API", () => {
  it("requires at least one saved job description", async () => {
    vi.spyOn(openAiApiKey, "getOpenAiApiKey").mockReturnValue("test-api-key");
    prismaMock.jobDescription.findMany.mockResolvedValue([]);

    const response = await generateInsight(
      new Request("http://localhost/api/job-descriptions/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "What do Python-heavy roles typically require?",
        }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Save at least one job description");
  });

  it("returns generated insights across the corpus", async () => {
    vi.spyOn(openAiApiKey, "getOpenAiApiKey").mockReturnValue("test-api-key");
    prismaMock.jobDescription.findMany.mockResolvedValue([
      {
        id: "jd-1",
        companyName: "Medallion",
        roleTitle: "Senior Software Engineer",
        body: "Python and React role.",
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
        updatedAt: new Date("2026-07-01T00:00:00.000Z"),
      },
    ]);
    vi.spyOn(jdInsights, "generateJdInsights").mockResolvedValue(
      "Python and React are common requirements.",
    );

    const response = await generateInsight(
      new Request("http://localhost/api/job-descriptions/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "What do Python-heavy roles typically require?",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      answer: "Python and React are common requirements.",
    });
  });

  it("rejects corpora that exceed the character limit", async () => {
    vi.spyOn(openAiApiKey, "getOpenAiApiKey").mockReturnValue("test-api-key");
    prismaMock.jobDescription.findMany.mockResolvedValue([
      {
        id: "jd-1",
        companyName: "Huge Corp",
        roleTitle: null,
        body: "x".repeat(jdInsights.MAX_CORPUS_CHARS),
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
        updatedAt: new Date("2026-07-01T00:00:00.000Z"),
      },
    ]);

    const response = await generateInsight(
      new Request("http://localhost/api/job-descriptions/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "What do Python-heavy roles typically require?",
        }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("too large");
  });
});
