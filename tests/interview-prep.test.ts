import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildInterviewPrepPrompt,
  generateInterviewPrep,
  parseInterviewPrepResponse,
} from "@/lib/interview-prep";

const validPrep = {
  techStackSummary: "React, TypeScript, and AWS.",
  roleFocusSummary: "Senior full-stack engineer for healthcare products.",
  technicalQuestionsToAsk: [
    "How does your team structure React applications?",
    "What does your deployment pipeline look like?",
    "How do you test services that integrate with AWS?",
    "Which parts of the stack would I own in the first 90 days?",
    "How do you balance feature delivery with reliability work?",
  ],
  culturalQuestionsToAsk: [
    "How does the team collaborate across product and engineering?",
    "What does success look like in the first six months?",
    "How do engineers get feedback here?",
    "What do you enjoy most about the team culture?",
    "How does the team handle changing priorities?",
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

  it("requests questions the candidate should ask interviewers", () => {
    const prompt = buildInterviewPrepPrompt({
      resume: "Engineer.",
      companyName: "Acme",
      jobDescription: "Cloud-native services.",
    });

    expect(prompt).toContain("technicalQuestionsToAsk");
    expect(prompt).toContain("culturalQuestionsToAsk");
    expect(prompt).toContain("ask the interviewer");
    expect(prompt).toContain("first person");
  });

  it("excludes behavioral questions directed at the candidate", () => {
    const prompt = buildInterviewPrepPrompt({
      resume: "Engineer.",
      companyName: "Acme",
      jobDescription: "Role.",
    });

    expect(prompt).toContain(
      'Do NOT include people-management questions or behavioral "tell me about a time you..." questions',
    );
  });
});

describe("parseInterviewPrepResponse", () => {
  it("parses valid interview prep JSON", () => {
    expect(parseInterviewPrepResponse(JSON.stringify(validPrep))).toEqual(
      validPrep,
    );
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
});
