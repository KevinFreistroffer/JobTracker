import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getJobDescriptionPreview,
  JdLibrary,
  SavedJobDescriptionItem,
} from "@/components/jd-library";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("getJobDescriptionPreview", () => {
  it("truncates long descriptions when collapsed", () => {
    const body = "A".repeat(250);

    expect(getJobDescriptionPreview(body, false, 200)).toEqual({
      text: `${"A".repeat(200)}…`,
      needsTruncation: true,
    });
  });

  it("shows the full description when expanded", () => {
    const body = "A".repeat(250);

    expect(getJobDescriptionPreview(body, true, 200)).toEqual({
      text: body,
      needsTruncation: true,
    });
  });
});

describe("SavedJobDescriptionItem", () => {
  const jobDescription = {
    id: "jd-1",
    companyName: "Medallion",
    roleTitle: "Senior Software Engineer",
    body: `${"Build healthcare software. ".repeat(20)}`,
    isAiRole: false,
    createdAt: "2026-07-06T00:00:00.000Z",
    updatedAt: "2026-07-06T00:00:00.000Z",
  };

  it("expands only via the show full description button", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onDelete = vi.fn();

    render(
      <SavedJobDescriptionItem
        jobDescription={jobDescription}
        expanded={false}
        onToggle={onToggle}
        onDelete={onDelete}
        onToggleAiRole={vi.fn()}
        isTogglingAiRole={false}
      />,
    );

    expect(screen.getByText(/Build healthcare software\./)).toBeInTheDocument();
    expect(screen.queryByText(jobDescription.body)).not.toBeInTheDocument();

    await user.click(screen.getByText(/Build healthcare software\./));
    expect(onToggle).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: /show full description/i }),
    );
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe("JdLibrary", () => {
  it("renders the saved job description list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "jd-1",
            companyName: "Medallion",
            roleTitle: "Senior Software Engineer",
            body: "Build healthcare software with React and TypeScript.",
            createdAt: "2026-07-06T00:00:00.000Z",
            updatedAt: "2026-07-06T00:00:00.000Z",
          },
          {
            id: "jd-2",
            companyName: "Northstar",
            roleTitle: null,
            body: "Python-heavy backend role.",
            createdAt: "2026-07-05T00:00:00.000Z",
            updatedAt: "2026-07-05T00:00:00.000Z",
          },
        ],
      }),
    );

    render(<JdLibrary />);

    expect(await screen.findByText(/Saved Job Descriptions \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Medallion — Senior Software Engineer/)).toBeInTheDocument();
    expect(screen.getByText(/Northstar/)).toBeInTheDocument();
    expect(
      screen.getByText(/Build healthcare software with React and TypeScript\./),
    ).toBeInTheDocument();
    expect(screen.getByText(/Python-heavy backend role\./)).toBeInTheDocument();
  });
});
