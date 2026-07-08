import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OpportunityDashboard } from "@/components/opportunity-dashboard";
import type { OpportunityRecord } from "@/lib/constants";

const opportunityWithNotes: OpportunityRecord = {
  id: "1",
  contactType: "EMAIL",
  status: "NEW",
  recruiterName: "Jane Smith",
  recruiterEmail: "jane@example.com",
  companyName: "Acme Corp",
  roleTitle: "Software Developer",
  contactDate: "2025-07-01T00:00:00.000Z",
  interviewAt: null,
  interviewReminderEnabled: false,
  notes: "Discussed remote options and comp range.",
  archivedAt: null,
  createdAt: "2025-07-01T00:00:00.000Z",
  updatedAt: "2025-07-01T00:00:00.000Z",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OpportunityDashboard", () => {
  it("renders the notes content for an opportunity", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [opportunityWithNotes],
      }),
    );

    render(<OpportunityDashboard />);

    await waitFor(() => {
      expect(
        screen.getAllByText(/Discussed remote options and comp range\./).length,
      ).toBeGreaterThan(0);
    });
  });

  it("shows archive action for active opportunities", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [opportunityWithNotes],
      }),
    );

    render(<OpportunityDashboard />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /archive/i }).length).toBeGreaterThan(0);
    });
  });

  it("shows restore action for archived opportunities", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            ...opportunityWithNotes,
            archivedAt: "2025-07-08T00:00:00.000Z",
          },
        ],
      }),
    );

    render(<OpportunityDashboard />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /restore/i }).length).toBeGreaterThan(0);
    });
  });
});
