import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OpportunityForm } from "@/components/opportunity-form";

describe("OpportunityForm", () => {
  it("renders required fields and submits valid values", async () => {
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
      contactType: "EMAIL",
      status: "NEW",
    });
  });

  it("shows validation errors for missing required fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <OpportunityForm onSubmit={onSubmit} onCancel={onCancel} />,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Recruiter name is required")).toBeInTheDocument();
    expect(screen.getByText("Company name is required")).toBeInTheDocument();
  });
});
