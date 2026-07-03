import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildWhyWorkHerePrompt,
  generateWhyWorkHereAnswer,
} from "@/lib/why-work-here";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("buildWhyWorkHerePrompt", () => {
  it("includes the company name in the interview question", () => {
    const prompt = buildWhyWorkHerePrompt({
      resume: "Senior engineer with React experience.",
      companyName: "Acme Corp",
      jobDescription: "Looking for a React engineer.",
    });

    expect(prompt).toContain(
      'Why do you want to work for Acme Corp?',
    );
    expect(prompt).toContain("Senior engineer with React experience.");
    expect(prompt).toContain("Looking for a React engineer.");
  });

  it("requests both short and long answer versions as JSON", () => {
    const prompt = buildWhyWorkHerePrompt({
      resume: "Senior full-stack engineer with React and Python experience.",
      companyName: "Medallion",
      jobDescription:
        "Medallion improves healthcare delivery with React, TypeScript, and Python.",
    });

    expect(prompt).toContain("The short answer should:");
    expect(prompt).toContain("Be 1-2 sentences total");
    expect(prompt).toContain("The long answer should:");
    expect(prompt).toContain('"shortAnswer"');
    expect(prompt).toContain('"longAnswer"');
    expect(prompt).toContain("Medallion");
  });

  it("instructs the model to stay truthful to the resume", () => {
    const prompt = buildWhyWorkHerePrompt({
      resume: "AWS and TypeScript experience.",
      companyName: "Northstar Labs",
      jobDescription: "Build cloud-native services.",
    });

    expect(prompt).toContain("do not invent");
    expect(prompt).toContain("AWS and TypeScript experience.");
  });
});

describe("generateWhyWorkHereAnswer", () => {
  it("returns short and long answers from the model response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  shortAnswer: "Short answer.",
                  longAnswer: "Long answer.",
                }),
              },
            },
          ],
        }),
      }),
    );

    const result = await generateWhyWorkHereAnswer(
      {
        resume: "React and Python engineer.",
        companyName: "Medallion",
        jobDescription: "Healthcare technology role.",
      },
      "test-api-key",
    );

    expect(result).toEqual({
      shortAnswer: "Short answer.",
      longAnswer: "Long answer.",
    });
  });
});
