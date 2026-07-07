import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAiRequirementExtractPrompt,
  extractAiRequirementsFromJobDescription,
  parseAiRequirementExtractResponse,
} from "@/lib/ai-requirement-extract";

const validExtract = {
  requirements: [
    {
      text: "Strong understanding of AI governance and security best practices",
      category: "governance",
    },
    {
      text: "Advanced knowledge of AI systems/vendors, models, capacity planning and provisioning",
      category: "infrastructure",
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("buildAiRequirementExtractPrompt", () => {
  it("includes company, role, and job description content", () => {
    const prompt = buildAiRequirementExtractPrompt({
      companyName: "Acme AI",
      roleTitle: "AI Platform Lead",
      jobDescriptionId: "jd-1",
      body: "Own AI governance and model deployment.",
    });

    expect(prompt).toContain("Acme AI");
    expect(prompt).toContain("AI Platform Lead");
    expect(prompt).toContain("jd-1");
    expect(prompt).toContain("Own AI governance and model deployment.");
    expect(prompt).toContain("AI-specific");
  });
});

describe("parseAiRequirementExtractResponse", () => {
  it("parses valid extraction JSON", () => {
    expect(
      parseAiRequirementExtractResponse(JSON.stringify(validExtract)),
    ).toEqual(validExtract);
  });

  it("rejects invalid JSON", () => {
    expect(() => parseAiRequirementExtractResponse("not json")).toThrow(
      "OpenAI returned invalid JSON",
    );
  });

  it("rejects invalid shapes", () => {
    expect(() =>
      parseAiRequirementExtractResponse(
        JSON.stringify({ requirements: [{ text: "" }] }),
      ),
    ).toThrow("OpenAI returned an invalid AI requirement extract shape");
  });
});

describe("extractAiRequirementsFromJobDescription", () => {
  it("calls OpenAI and returns parsed requirements", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(validExtract) } }],
        }),
      }),
    );

    const result = await extractAiRequirementsFromJobDescription(
      {
        companyName: "Acme AI",
        roleTitle: "AI Lead",
        jobDescriptionId: "jd-1",
        body: "AI governance required.",
      },
      "test-api-key",
    );

    expect(result).toEqual(validExtract);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
        }),
      }),
    );
  });
});
