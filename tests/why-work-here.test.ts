import { describe, expect, it } from "vitest";
import { buildWhyWorkHerePrompt } from "@/lib/why-work-here";

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
