import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoverLetterForm } from "@/components/cover-letter-form";
import * as downloadTextFile from "@/lib/download-text-file";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("CoverLetterForm", () => {
  it("downloads the generated cover letter as a text file", async () => {
    const user = userEvent.setup();
    const downloadSpy = vi
      .spyOn(downloadTextFile, "downloadTextFile")
      .mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          coverLetter: "Dear Hiring Manager,\n\nI am excited to apply.",
        }),
      }),
    );

    render(<CoverLetterForm />);

    await user.type(
      screen.getByLabelText(/job description/i),
      "Build healthcare software.",
    );
    await user.type(screen.getByLabelText(/company name/i), "Medallion");
    await user.click(
      screen.getByRole("button", { name: /generate cover letter/i }),
    );

    const downloadButton = await screen.findByRole("button", {
      name: /download/i,
    });
    await user.click(downloadButton);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith(
        "Dear Hiring Manager,\n\nI am excited to apply.",
        "cover-letter-medallion.txt",
      );
    });
  });
});
