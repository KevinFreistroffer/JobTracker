import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCoverLetterPrompt,
  generateCoverLetter,
} from "@/lib/cover-letter";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("buildCoverLetterPrompt", () => {
  it("includes the company name, resume, and job description", () => {
    const prompt = buildCoverLetterPrompt({
      resume: "Senior full-stack engineer with React and Python experience.",
      companyName: "Medallion",
      jobDescription: "Build healthcare software with React and TypeScript.",
    });

    expect(prompt).toContain("cover letter for a software engineering role at Medallion");
    expect(prompt).toContain(
      "Senior full-stack engineer with React and Python experience.",
    );
    expect(prompt).toContain(
      "Build healthcare software with React and TypeScript.",
    );
    expect(prompt).toContain('candidate\'s name: Kevin Freistroffer');
    expect(prompt).not.toContain("[Your Name]");
    expect(prompt).not.toContain("Your Name");
  });

  it("instructs the model to stay truthful to the resume", () => {
    const prompt = buildCoverLetterPrompt({
      resume: "AWS and TypeScript experience.",
      companyName: "Northstar Labs",
      jobDescription: "Cloud-native services.",
    });

    expect(prompt).toContain("do not invent");
  });

  it("falls back to a generic company reference when none is given", () => {
    const prompt = buildCoverLetterPrompt({
      resume: "Engineer.",
      companyName: "",
      jobDescription: "Role.",
    });

    expect(prompt).toContain("role at the company");
  });
});

describe("generateCoverLetter", () => {
  it("returns the generated cover letter text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Dear Hiring Manager,\n\nI am excited...\n\nSincerely,\nKevin",
              },
            },
          ],
        }),
      }),
    );

    const result = await generateCoverLetter(
      {
        resume: "React and Python engineer.",
        companyName: "Medallion",
        jobDescription: "Healthcare technology role.",
      },
      "test-api-key",
    );

    expect(result).toContain("Dear Hiring Manager,");
    expect(result).toContain("Sincerely,");
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
      generateCoverLetter(
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
