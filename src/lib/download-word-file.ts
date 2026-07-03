import { Document, Packer, Paragraph, TextRun } from "docx";

export function buildCoverLetterFilename(companyName: string): string {
  const slug = companyName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `cover-letter-${slug}.docx` : "cover-letter.docx";
}

export async function downloadWordFile(
  content: string,
  filename: string,
): Promise<void> {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        new Paragraph({
          children: [new TextRun(paragraph)],
          spacing: { after: 240 },
        }),
    );

  const wordDocument = new Document({
    sections: [
      {
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(wordDocument);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
