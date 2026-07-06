import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApplicationMaterialsForm } from "@/components/application-materials-form";
import * as downloadFile from "@/lib/download-word-file";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("ApplicationMaterialsForm", () => {
  it("generates materials and saves the draft to the JD library", async () => {
    const user = userEvent.setup();
    const downloadSpy = vi
      .spyOn(downloadFile, "downloadWordFile")
      .mockResolvedValue(undefined);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          coverLetter: "Dear Hiring Manager,\n\nI am excited to apply.",
          shortAnswer: "I am excited about Medallion.",
          longAnswer: "Medallion's mission aligns with my experience.",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "jd-1" }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ApplicationMaterialsForm />);

    await user.type(
      screen.getByLabelText(/job description/i),
      "Build healthcare software.",
    );
    await user.type(screen.getByLabelText(/company name/i), "Medallion");
    await user.type(
      screen.getByLabelText(/role title/i),
      "Senior Software Engineer",
    );
    await user.click(
      screen.getByRole("button", { name: /generate materials/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/application-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Medallion",
          jobDescription: "Build healthcare software.",
        }),
      });
      expect(fetchMock).toHaveBeenCalledWith("/api/job-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Medallion",
          roleTitle: "Senior Software Engineer",
          body: "Build healthcare software.",
        }),
      });
    });

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
