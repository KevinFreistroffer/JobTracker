import { describe, expect, it } from "vitest";
import { APPLICATION_WORKSPACE_SECTIONS } from "@/lib/application-workspace-sections";

describe("application workspace sections", () => {
  it("includes job input and generated output sections", () => {
    const labels = APPLICATION_WORKSPACE_SECTIONS.map((section) => section.label);

    expect(labels).toContain("Job Description");
    expect(labels).toContain("Cover Letter");
    expect(labels).toContain("Tech Stack Summary");
    expect(labels).toContain("Culture Questions");
  });
});
