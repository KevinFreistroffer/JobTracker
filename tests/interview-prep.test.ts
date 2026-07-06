import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildInterviewPrepPrompt,
  generateInterviewPrep,
  parseInterviewPrepResponse,
} from "@/lib/interview-prep";

const validPrep = {
  techStackSummary: "React, TypeScript, and AWS.",
  roleFocusSummary: "Senior full-stack engineer for healthcare products.",
  technicalQuestions: [
    "How would you design a React data table?",
    "Explain TypeScript generics.",
    "Describe an AWS Lambda workflow.",
    "How do you test React components?",
    "What is your approach to API error handling?",
  ],
  culturalQuestions: [
    "Tell me about a time you collaborated across teams.",
    "How do you handle conflicting priorities?",
    "What motivates you in your work?",
    "Describe your ideal team environment.",
    "How do you give and receive feedback?",
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("buildInterviewPrepPrompt", () => {
  it("includes the company name, resume, and job description", () => {
    const prompt = buildInterviewPrepPrompt({
      resume: "Senior full-stack engineer with React and Python experience.",
      companyName: "Medallion",
      jobDescription: "Build healthcare software with React and TypeScript.",
    });

    expect(prompt).toContain("interview prep session at Medallion");
    expect(prompt).toContain(
      "Senior full-stack engineer with React and Python experience.",
    );
    expect(prompt).toContain(
      "Build healthcare software with React and TypeScript.",
    );
  });

  it("requests JSON output with technical and cultural question arrays", () => {
    const prompt = buildInterviewPrepPrompt({
      resume: "Engineer.",
      companyName: "Acme",
      jobDescription: "Cloud-native services.",
    });

    expect(prompt).toContain('"technicalQuestions"');
    expect(prompt).toContain('"culturalQuestions"');
    expect(prompt).toContain("exactly 5");
  });

  it("excludes people-management cultural questions", () => {
    const prompt = buildInterviewPrepPrompt({
      resume: "Engineer.",
      companyName: "Acme",
      jobDescription: "Role.",
    });

    expect(prompt).toContain("Do NOT include people-management");
    expect(prompt).toContain("individual contributor role");
  });

  it("falls back to a generic company reference when none is given", () => {
    const prompt = buildInterviewPrepPrompt({
      resume: "Engineer.",
      companyName: "",
      jobDescription: "Role.",
    });

    expect(prompt).toContain("interview prep session at the company");
  });
});

describe("parseInterviewPrepResponse", () => {
  it("parses valid interview prep JSON", () => {
    expect(parseInterviewPrepResponse(JSON.stringify(validPrep))).toEqual(
      validPrep,
    );
  });

  it("throws when JSON is invalid", () => {
    expect(() => parseInterviewPrepResponse("not json")).toThrow(
      "invalid JSON",
    );
  });

  it("throws when the shape is invalid", () => {
    expect(() =>
      parseInterviewPrepResponse(
        JSON.stringify({
          ...validPrep,
          technicalQuestions: ["Only one question"],
        }),
      ),
    ).toThrow("invalid interview prep shape");
  });
});

describe("generateInterviewPrep", () => {
  it("returns parsed interview prep content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(validPrep) } }],
        }),
      }),
    );

    const result = await generateInterviewPrep(
      {
        resume: "React engineer.",
        companyName: "Medallion",
        jobDescription: "Healthcare technology role.",
      },
      "test-api-key",
    );

    expect(result).toEqual(validPrep);
  });

  it("throws when the model returns an empty response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "" } }] }),
      }),
    );

    await expect(
      generateInterviewPrep(
        {
          resume: "Engineer.",
          companyName: "Acme",
          jobDescription: "Role.",
        },
        "test-api-key",
      ),
    ).rejects.toThrow("empty response");
  });
});
