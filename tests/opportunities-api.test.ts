import { afterEach, describe, expect, it, vi } from "vitest";
import { DELETE as deleteOpportunity } from "@/app/api/opportunities/[id]/route";
import { POST as createOpportunity } from "@/app/api/opportunities/route";
import * as saveJobDescription from "@/lib/save-job-description-from-opportunity";

const prismaMock = vi.hoisted(() => ({
  opportunity: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/opportunities", () => {
  it("creates an opportunity and saves a job description to the library", async () => {
    prismaMock.opportunity.create.mockResolvedValue({
      id: "opp-1",
      contactType: "EMAIL",
      status: "NEW",
      recruiterName: "Jane Smith",
      recruiterEmail: "jane@acme.com",
      companyName: "Acme",
      roleTitle: "AI Platform Lead",
      contactDate: new Date("2026-07-01T00:00:00.000Z"),
      interviewAt: null,
      interviewReminderEnabled: false,
      notes: "",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    });
    vi.spyOn(
      saveJobDescription,
      "saveJobDescriptionFromOpportunity",
    ).mockResolvedValue({
      id: "jd-1",
      companyName: "Acme",
      roleTitle: "AI Platform Lead",
      body: "Own LLM deployment and governance.",
      isAiRole: true,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    });

    const response = await createOpportunity(
      new Request("http://localhost/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Acme",
          roleTitle: "AI Platform Lead",
          jobDescription: "Own LLM deployment and governance.",
          isAiRole: true,
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      companyName: "Acme",
      savedJobDescription: {
        companyName: "Acme",
        isAiRole: true,
      },
    });
    expect(saveJobDescription.saveJobDescriptionFromOpportunity).toHaveBeenCalledWith({
      opportunityId: "opp-1",
      companyName: "Acme",
      roleTitle: "AI Platform Lead",
      jobDescription: "Own LLM deployment and governance.",
      isAiRole: true,
    });
  });

  it("creates an opportunity without saving when no job description is provided", async () => {
    prismaMock.opportunity.create.mockResolvedValue({
      id: "opp-1",
      contactType: null,
      status: "NEW",
      recruiterName: null,
      recruiterEmail: null,
      companyName: "Acme",
      roleTitle: null,
      contactDate: null,
      interviewAt: null,
      interviewReminderEnabled: false,
      notes: "",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    });
    vi.spyOn(
      saveJobDescription,
      "saveJobDescriptionFromOpportunity",
    ).mockResolvedValue(null);

    const response = await createOpportunity(
      new Request("http://localhost/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Acme",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      savedJobDescription: null,
    });
  });
});

describe("DELETE /api/opportunities/[id]", () => {
  it("deletes the opportunity and relies on database cascade for linked job descriptions", async () => {
    prismaMock.opportunity.findUnique.mockResolvedValue({
      id: "opp-1",
      contactType: null,
      status: "NEW",
      recruiterName: null,
      recruiterEmail: null,
      companyName: "Acme",
      roleTitle: null,
      contactDate: null,
      interviewAt: null,
      interviewReminderEnabled: false,
      notes: "",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    });
    prismaMock.opportunity.delete.mockResolvedValue({
      id: "opp-1",
    });

    const response = await deleteOpportunity(
      new Request("http://localhost/api/opportunities/opp-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "opp-1" }) },
    );

    expect(response.status).toBe(200);
    expect(prismaMock.opportunity.delete).toHaveBeenCalledWith({
      where: { id: "opp-1" },
    });
  });
});
