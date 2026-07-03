import { ContactType } from "@prisma/client";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OpportunityForm } from "@/components/opportunity-form";
import { OPPORTUNITY_DRAFT_KEY } from "@/lib/form-drafts";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("OpportunityForm", () => {
  it("renders fields and submits valid values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    render(
      <OpportunityForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        submitLabel="Create"
      />,
    );

    expect(screen.getByLabelText(/contact type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/recruiter name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/recruiter name/i), "Jane Smith");
    await user.type(screen.getByLabelText(/company name/i), "Acme Corp");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      recruiterName: "Jane Smith",
      companyName: "Acme Corp",
      contactType: "",
      status: "NEW",
    });
  });

  it("submits without filling any fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    render(<OpportunityForm onSubmit={onSubmit} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      contactType: "",
      status: "NEW",
      recruiterName: "",
      companyName: "",
      contactDate: "",
      notes: "",
    });
  });

  it("hides recruiter email when LinkedIn is selected", () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(
      <OpportunityForm
        initialValues={{ contactType: ContactType.LINKEDIN }}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    expect(
      container.querySelector("#recruiterEmail"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/recruiter name/i)).toBeInTheDocument();
  });

  it("restores and clears a persisted draft", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    window.localStorage.setItem(
      OPPORTUNITY_DRAFT_KEY,
      JSON.stringify({
        contactType: "",
        status: "NEW",
        recruiterName: "Jane Smith",
        recruiterEmail: "",
        companyName: "Acme Corp",
        roleTitle: "",
        contactDate: "",
        notes: "",
      }),
    );

    render(
      <OpportunityForm
        persistKey={OPPORTUNITY_DRAFT_KEY}
        onSubmit={onSubmit}
        onCancel={onCancel}
        submitLabel="Create"
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/company name/i)).toHaveValue("Acme Corp");
    });

    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(window.localStorage.getItem(OPPORTUNITY_DRAFT_KEY)).toBeNull();
    });
  });
});
