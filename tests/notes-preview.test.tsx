import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { NotesPreview } from "@/components/notes-preview";

const LONG_NOTE = "A".repeat(200);

describe("NotesPreview", () => {
  it("shows short notes in full without a toggle", () => {
    render(<NotesPreview notes="Quick follow-up call." />);

    expect(screen.getByText(/Quick follow-up call\./)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /show more/i }),
    ).not.toBeInTheDocument();
  });

  it("truncates long notes and expands on click", async () => {
    const user = userEvent.setup();
    render(<NotesPreview notes={LONG_NOTE} truncateLength={50} />);

    const toggle = screen.getByRole("button", { name: /show more/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(/…$/)).toBeInTheDocument();

    await user.click(toggle);

    const collapse = screen.getByRole("button", { name: /show less/i });
    expect(collapse).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(LONG_NOTE)).toBeInTheDocument();
  });
});
