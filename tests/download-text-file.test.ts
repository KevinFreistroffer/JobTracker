import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCoverLetterFilename,
  downloadTextFile,
} from "@/lib/download-text-file";

describe("buildCoverLetterFilename", () => {
  it("includes a slugified company name when provided", () => {
    expect(buildCoverLetterFilename("Acme Corp")).toBe(
      "cover-letter-acme-corp.txt",
    );
  });

  it("falls back to a generic filename when company is empty", () => {
    expect(buildCoverLetterFilename("")).toBe("cover-letter.txt");
    expect(buildCoverLetterFilename("   ")).toBe("cover-letter.txt");
  });
});

describe("downloadTextFile", () => {
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

  it("creates a blob download with the given filename", () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:cover-letter");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL,
    });
    const click = vi.fn();
    const createElement = vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click,
    } as HTMLAnchorElement);

    downloadTextFile("Dear Hiring Manager,", "cover-letter-acme.txt");

    expect(createObjectURL).toHaveBeenCalled();
    expect(createElement).toHaveBeenCalledWith("a");
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:cover-letter");
  });
});
