import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppNav } from "@/components/app-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/why-work-here",
}));

describe("AppNav", () => {
  it("renders navigation tabs", () => {
    render(<AppNav />);

    expect(screen.getByRole("link", { name: "Job Tracker" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Why Work Here" })).toHaveAttribute(
      "href",
      "/why-work-here",
    );
  });
});
