import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAiStudySubjectsPrompt,
  generateAiStudySubjects,
  parseAiStudySubjectsResponse,
} from "@/lib/ai-study-subjects";

const validStudySubjects = {
  subjects: [
    {
      name: "AI Governance & Security",
      rationale: "Appears across multiple AI leadership roles.",
      relatedRequirements: [
        "Strong understanding of AI governance and security best practices",
      ],
      priority: "high",
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("buildAiStudySubjectsPrompt", () => {
  it("includes requirement counts and canonical text", () => {
    const prompt = buildAiStudySubjectsPrompt({
      requirements: [
        {
          canonicalText:
            "Strong understanding of AI governance and security best practices",
          occurrenceCount: 3,
          category: "governance",
        },
      ],
    });

    expect(prompt).toContain("3 JDs");
    expect(prompt).toContain("governance");
    expect(prompt).toContain(
      "Strong understanding of AI governance and security best practices",
    );
  });
});

describe("parseAiStudySubjectsResponse", () => {
  it("parses valid study subjects JSON", () => {
    expect(
      parseAiStudySubjectsResponse(JSON.stringify(validStudySubjects)),
    ).toEqual(validStudySubjects);
  });

  it("rejects empty subjects", () => {
    expect(() =>
      parseAiStudySubjectsResponse(JSON.stringify({ subjects: [] })),
    ).toThrow("OpenAI returned an invalid study subjects shape");
  });
});

describe("generateAiStudySubjects", () => {
  it("calls OpenAI and returns study subjects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            { message: { content: JSON.stringify(validStudySubjects) } },
          ],
        }),
      }),
    );

    const result = await generateAiStudySubjects(
      {
        requirements: [
          {
            canonicalText:
              "Strong understanding of AI governance and security best practices",
            occurrenceCount: 2,
            category: "governance",
          },
        ],
      },
      "test-api-key",
    );

    expect(result).toEqual(validStudySubjects);
  });
});
