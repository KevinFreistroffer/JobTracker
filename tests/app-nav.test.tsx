import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppNav } from "@/components/app-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/application-materials",
}));

describe("AppNav", () => {
  it("renders navigation tabs", () => {
    render(<AppNav />);

    expect(screen.getByRole("link", { name: "Job Tracker" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "Application Materials" }),
    ).toHaveAttribute("href", "/application-materials");
    expect(
      screen.getByRole("link", { name: "Interview Prep" }),
    ).toHaveAttribute("href", "/interview-prep");
    expect(screen.getByRole("link", { name: "JD Library" })).toHaveAttribute(
      "href",
      "/jd-library",
    );
  });
});
