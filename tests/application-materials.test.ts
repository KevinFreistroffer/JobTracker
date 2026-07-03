import { afterEach, describe, expect, it, vi } from "vitest";
import { generateApplicationMaterials } from "@/lib/application-materials";
import * as coverLetter from "@/lib/cover-letter";
import * as whyWorkHere from "@/lib/why-work-here";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateApplicationMaterials", () => {
  it("generates the cover letter and both why-work-here answers together", async () => {
    vi.spyOn(coverLetter, "generateCoverLetter").mockResolvedValue(
      "Dear Hiring Manager,\n\nI am excited to apply.",
    );
    vi.spyOn(whyWorkHere, "generateWhyWorkHereAnswer").mockResolvedValue({
      shortAnswer: "Short answer.",
      longAnswer: "Long answer.",
    });

    const result = await generateApplicationMaterials(
      {
        resume: "React engineer.",
        companyName: "Medallion",
        jobDescription: "Healthcare software role.",
      },
      "test-api-key",
    );

    expect(result).toEqual({
      coverLetter: "Dear Hiring Manager,\n\nI am excited to apply.",
      shortAnswer: "Short answer.",
      longAnswer: "Long answer.",
    });
    expect(coverLetter.generateCoverLetter).toHaveBeenCalledWith(
      {
        resume: "React engineer.",
        companyName: "Medallion",
        jobDescription: "Healthcare software role.",
      },
      "test-api-key",
    );
    expect(whyWorkHere.generateWhyWorkHereAnswer).toHaveBeenCalledWith(
      {
        resume: "React engineer.",
        companyName: "Medallion",
        jobDescription: "Healthcare software role.",
      },
      "test-api-key",
    );
  });
});
