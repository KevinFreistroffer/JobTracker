import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAiRequirementMergePrompt,
  mergeAiRequirements,
  parseAiRequirementMergeResponse,
} from "@/lib/ai-requirement-merge";

const validMerge = {
  groups: [
    {
      canonicalText:
        "Strong understanding of AI governance and security best practices",
      category: "governance",
      members: [
        {
          jobDescriptionId: "jd-1",
          rawText: "AI governance and security experience",
        },
        {
          jobDescriptionId: "jd-2",
          rawText: "Knowledge of responsible AI policies",
        },
      ],
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("buildAiRequirementMergePrompt", () => {
  it("includes existing and new requirements", () => {
    const prompt = buildAiRequirementMergePrompt({
      existingRequirements: [
        {
          id: "req-1",
          canonicalText: "Experience with model serving",
          category: "infrastructure",
        },
      ],
      newRequirements: [
        {
          jobDescriptionId: "jd-1",
          rawText: "AI governance and security experience",
        },
      ],
    });

    expect(prompt).toContain("Experience with model serving");
    expect(prompt).toContain("AI governance and security experience");
    expect(prompt).toContain("jd-1");
  });
});

describe("parseAiRequirementMergeResponse", () => {
  it("parses valid merge JSON", () => {
    expect(parseAiRequirementMergeResponse(JSON.stringify(validMerge))).toEqual(
      validMerge,
    );
  });

  it("rejects groups without members", () => {
    expect(() =>
      parseAiRequirementMergeResponse(
        JSON.stringify({
          groups: [{ canonicalText: "Test", members: [] }],
        }),
      ),
    ).toThrow("OpenAI returned an invalid AI requirement merge shape");
  });
});

describe("mergeAiRequirements", () => {
  it("calls OpenAI and returns merged groups", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(validMerge) } }],
        }),
      }),
    );

    const result = await mergeAiRequirements(
      {
        existingRequirements: [],
        newRequirements: [
          {
            jobDescriptionId: "jd-1",
            rawText: "AI governance and security experience",
          },
        ],
      },
      "test-api-key",
    );

    expect(result).toEqual(validMerge);
  });
});
