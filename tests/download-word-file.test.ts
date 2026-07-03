import { afterEach, describe, expect, it, vi } from "vitest";

const docxMocks = vi.hoisted(() => ({
  Document: vi.fn((options) => ({ type: "document", options })),
  Paragraph: vi.fn((options) => ({ type: "paragraph", options })),
  TextRun: vi.fn((text) => ({ type: "text-run", text })),
  toBlob: vi.fn(async () => new Blob(["docx-content"])),
}));

vi.mock("docx", () => ({
  Document: docxMocks.Document,
  Paragraph: docxMocks.Paragraph,
  TextRun: docxMocks.TextRun,
  Packer: {
    toBlob: docxMocks.toBlob,
  },
}));

import {
  buildCoverLetterFilename,
  downloadWordFile,
} from "@/lib/download-word-file";

describe("buildCoverLetterFilename", () => {
  it("includes a slugified company name when provided", () => {
    expect(buildCoverLetterFilename("Acme Corp")).toBe(
      "cover-letter-acme-corp.docx",
    );
  });

  it("falls back to a generic filename when company is empty", () => {
    expect(buildCoverLetterFilename("")).toBe("cover-letter.docx");
    expect(buildCoverLetterFilename("   ")).toBe("cover-letter.docx");
  });
});

describe("downloadWordFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    docxMocks.Document.mockClear();
    docxMocks.Paragraph.mockClear();
    docxMocks.TextRun.mockClear();
    docxMocks.toBlob.mockClear();
  });

  it("creates a Word document download with the given filename", async () => {
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

    await downloadWordFile(
      "Dear Hiring Manager,\n\nI am excited to apply.",
      "cover-letter-acme.docx",
    );

    expect(docxMocks.Document).toHaveBeenCalled();
    expect(docxMocks.Paragraph).toHaveBeenCalledTimes(2);
    expect(docxMocks.toBlob).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalled();
    expect(createElement).toHaveBeenCalledWith("a");
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:cover-letter");
  });
});
