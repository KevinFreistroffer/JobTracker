import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildJdInsightsPrompt,
  generateJdInsights,
  getCorpusCharCount,
  MAX_CORPUS_CHARS,
} from "@/lib/jd-insights";

const sampleJobDescriptions = [
  {
    companyName: "Medallion",
    roleTitle: "Senior Software Engineer",
    body: "Build healthcare software with Python, React, and AWS.",
    createdAt: "2026-07-01T00:00:00.000Z",
  },
  {
    companyName: "Northstar",
    roleTitle: null,
    body: "Python-heavy backend services with FastAPI and PostgreSQL.",
    createdAt: "2026-07-02T00:00:00.000Z",
  },
];

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("buildJdInsightsPrompt", () => {
  it("includes the question and all saved job descriptions", () => {
    const prompt = buildJdInsightsPrompt({
      question: "What do Python-heavy roles typically require?",
      jobDescriptions: sampleJobDescriptions,
    });

    expect(prompt).toContain("What do Python-heavy roles typically require?");
    expect(prompt).toContain("Medallion");
    expect(prompt).toContain("Northstar");
    expect(prompt).toContain("Python-heavy backend services");
  });

  it("instructs the model to say when evidence is insufficient", () => {
    const prompt = buildJdInsightsPrompt({
      question: "What do remote-first roles require?",
      jobDescriptions: sampleJobDescriptions,
    });

    expect(prompt).toContain("does not contain enough relevant evidence");
  });
});

describe("getCorpusCharCount", () => {
  it("sums the corpus size across saved job descriptions", () => {
    expect(getCorpusCharCount(sampleJobDescriptions)).toBeGreaterThan(0);
    expect(getCorpusCharCount(sampleJobDescriptions)).toBeLessThan(
      MAX_CORPUS_CHARS,
    );
  });
});

describe("generateJdInsights", () => {
  it("returns the generated insight text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content:
                  "Python-heavy roles in your library commonly require FastAPI and PostgreSQL.",
              },
            },
          ],
        }),
      }),
    );

    const result = await generateJdInsights(
      {
        question: "What do Python-heavy roles typically require?",
        jobDescriptions: sampleJobDescriptions,
      },
      "test-api-key",
    );

    expect(result).toContain("Python-heavy roles");
  });
});
