import { describe, expect, it } from "vitest";
import { suggestIsAiRole } from "@/lib/suggest-is-ai-role";

describe("suggestIsAiRole", () => {
  it("returns true when the role title mentions AI", () => {
    expect(
      suggestIsAiRole("Director of AI Engineering", "Build platform services."),
    ).toBe(true);
  });

  it("returns true when the body mentions machine learning", () => {
    expect(
      suggestIsAiRole(
        "Software Engineer",
        "Experience with machine learning pipelines required.",
      ),
    ).toBe(true);
  });

  it("returns true for LLM and MLOps keywords", () => {
    expect(suggestIsAiRole("Platform Engineer", "Deploy LLM workloads.")).toBe(
      true,
    );
    expect(
      suggestIsAiRole("Engineer", "Own MLOps and model serving."),
    ).toBe(true);
  });

  it("returns false for non-AI roles", () => {
    expect(
      suggestIsAiRole(
        "Senior Software Engineer",
        "React, TypeScript, and PostgreSQL experience.",
      ),
    ).toBe(false);
  });
});
