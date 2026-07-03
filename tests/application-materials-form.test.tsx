import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApplicationMaterialsForm } from "@/components/application-materials-form";
import * as downloadFile from "@/lib/download-word-file";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ApplicationMaterialsForm", () => {
  it("generates cover letter and why-work-here answers together", async () => {
    const user = userEvent.setup();
    const downloadSpy = vi
      .spyOn(downloadFile, "downloadWordFile")
      .mockResolvedValue(undefined);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          coverLetter: "Dear Hiring Manager,\n\nI am excited to apply.",
          shortAnswer: "I am excited about Medallion.",
          longAnswer: "Medallion's mission aligns with my experience.",
        }),
      }),
    );

    render(<ApplicationMaterialsForm />);

    await user.type(
      screen.getByLabelText(/job description/i),
      "Build healthcare software.",
    );
    await user.type(screen.getByLabelText(/company name/i), "Medallion");
    await user.click(
      screen.getByRole("button", { name: /generate materials/i }),
    );

    expect(
      await screen.findByText(/Dear Hiring Manager,/),
    ).toBeInTheDocument();
    expect(screen.getByText(/I am excited about Medallion\./)).toBeInTheDocument();
    expect(
      screen.getByText(/Medallion's mission aligns with my experience\./),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^download$/i }));

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith(
        "Dear Hiring Manager,\n\nI am excited to apply.",
        "cover-letter-medallion.docx",
      );
    });
  });
});
