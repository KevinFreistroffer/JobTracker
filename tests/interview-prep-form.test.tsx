import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InterviewPrepForm } from "@/components/interview-prep-form";
import { APPLICATION_MATERIALS_DRAFT_KEY } from "@/lib/form-drafts";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("InterviewPrepForm", () => {
  it("prompts users to add a job description when none is shared", () => {
    render(<InterviewPrepForm />);

    expect(screen.getByText(/no job description yet/i)).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: /application materials/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "/application-materials");
  });

  it("generates interview prep from the shared job description draft", async () => {
    const user = userEvent.setup();

    window.localStorage.setItem(
      APPLICATION_MATERIALS_DRAFT_KEY,
      JSON.stringify({
        companyName: "Medallion",
        jobDescription: "Build healthcare software with React and TypeScript.",
      }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          techStackSummary: "React and TypeScript on AWS.",
          roleFocusSummary: "Healthcare full-stack engineer.",
          technicalQuestions: [
            "How do you structure React components?",
            "Explain TypeScript utility types.",
            "Describe an AWS deployment pipeline.",
            "How do you test API integrations?",
            "What is your debugging workflow?",
          ],
          culturalQuestions: [
            "Tell me about a cross-team project.",
            "How do you handle ambiguity?",
            "What kind of culture helps you do your best work?",
            "Describe a time you received tough feedback.",
            "Why are you interested in this company?",
          ],
        }),
      }),
    );

    render(<InterviewPrepForm />);

    expect(
      await screen.findByText(/Build healthcare software with React and TypeScript\./),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generate interview prep/i }),
      ).toBeEnabled();
    });

    await user.click(
      screen.getByRole("button", { name: /generate interview prep/i }),
    );

    expect(
      await screen.findByText(/React and TypeScript on AWS\./),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Healthcare full-stack engineer\./),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/How do you structure React components\?/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tell me about a cross-team project\./),
    ).toBeInTheDocument();
  });
});
