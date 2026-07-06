import { describe, expect, it } from "vitest";
import {
  opportunityInputSchema,
  opportunityUpdateSchema,
} from "@/lib/validations";

describe("opportunityInputSchema", () => {
  it("accepts a valid opportunity payload", () => {
    const result = opportunityInputSchema.safeParse({
      contactType: "EMAIL",
      status: "NEW",
      recruiterName: "Jane Smith",
      recruiterEmail: "jane@example.com",
      companyName: "Acme Corp",
      roleTitle: "Software Developer",
      contactDate: "2025-07-01",
      notes: "Follow up next week",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recruiterEmail).toBe("jane@example.com");
      expect(result.data.contactDate).toBeInstanceOf(Date);
    }
  });

  it("accepts an opportunity with all fields empty", () => {
    const result = opportunityInputSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contactType).toBeNull();
      expect(result.data.status).toBe("NEW");
      expect(result.data.recruiterName).toBeNull();
      expect(result.data.companyName).toBeNull();
      expect(result.data.contactDate).toBeNull();
      expect(result.data.notes).toBe("");
    }
  });

  it("normalizes empty optional fields", () => {
    const result = opportunityInputSchema.safeParse({
      contactType: "CALL",
      status: "INTERVIEWING",
      recruiterName: "Michael Chen",
      recruiterEmail: "",
      companyName: "Northstar Labs",
      roleTitle: "",
      contactDate: "2025-07-02",
      notes: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recruiterEmail).toBeNull();
      expect(result.data.roleTitle).toBeNull();
      expect(result.data.notes).toBe("");
    }
  });

  it("defaults missing notes to an empty string", () => {
    const result = opportunityInputSchema.safeParse({
      contactType: "EMAIL",
      status: "NEW",
      recruiterName: "Jane Smith",
      companyName: "Acme Corp",
      contactDate: "2025-07-02",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe("");
    }
  });

  it("accepts null notes and stores an empty string", () => {
    const result = opportunityInputSchema.safeParse({
      contactType: "EMAIL",
      status: "NEW",
      recruiterName: "Jane Smith",
      companyName: "Acme Corp",
      contactDate: "2025-07-02",
      notes: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe("");
    }
  });

  it("accepts null company name and role title", () => {
    const result = opportunityInputSchema.safeParse({
      status: "NEW",
      companyName: null,
      roleTitle: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.companyName).toBeNull();
      expect(result.data.roleTitle).toBeNull();
    }
  });

  it("rejects invalid recruiter email", () => {
    const result = opportunityInputSchema.safeParse({
      contactType: "EMAIL",
      status: "NEW",
      recruiterName: "Jane Smith",
      recruiterEmail: "not-an-email",
      companyName: "Acme Corp",
      contactDate: "2025-07-02",
    });

    expect(result.success).toBe(false);
  });

  it("normalizes interview fields for interview statuses", () => {
    const result = opportunityInputSchema.safeParse({
      status: "INTERVIEWING",
      interviewAt: "2025-07-10T14:30:00.000Z",
      interviewReminderEnabled: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interviewAt).toBeInstanceOf(Date);
      expect(result.data.interviewReminderEnabled).toBe(true);
    }
  });

  it("clears interview fields when status is not interview-related", () => {
    const result = opportunityInputSchema.safeParse({
      status: "NEW",
      interviewAt: "2025-07-10T14:30:00.000Z",
      interviewReminderEnabled: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interviewAt).toBeNull();
      expect(result.data.interviewReminderEnabled).toBe(false);
    }
  });

  it("stores an empty recruiter email for LinkedIn contacts", () => {
    const result = opportunityInputSchema.safeParse({
      contactType: "LINKEDIN",
      status: "NEW",
      recruiterName: "Alex Rivera",
      companyName: "Northstar Labs",
      contactDate: "2025-07-02",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recruiterEmail).toBe("");
    }
  });
});

describe("opportunityUpdateSchema", () => {
  it("allows partial updates", () => {
    const result = opportunityUpdateSchema.safeParse({
      status: "INTERVIEWED",
      notes: "Completed technical round",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("INTERVIEWED");
      expect(result.data.notes).toBe("Completed technical round");
    }
  });

  it("does not add notes when omitted from a partial update", () => {
    const result = opportunityUpdateSchema.safeParse({
      status: "INTERVIEWED",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
    }
  });
});
