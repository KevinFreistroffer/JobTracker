import { ContactType } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildParseRecruiterEmailPrompt,
  parseRecruiterEmail,
  parseRecruiterEmailResponse,
  toOpportunityFormValues,
} from "@/lib/parse-recruiter-email";

const parsedEmail = {
  contactType: ContactType.EMAIL,
  recruiterName: "Jane Smith",
  recruiterEmail: "jane@acme.com",
  companyName: "Acme Corp",
  roleTitle: "Senior Software Engineer",
  contactDate: "2026-07-06",
  notes: "Remote role. Next step is a phone screen.",
  jobDescription: null,
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("buildParseRecruiterEmailPrompt", () => {
  it("includes the pasted recruiter message", () => {
    const prompt = buildParseRecruiterEmailPrompt(
      "From: Jane Smith <jane@acme.com>\nSubject: Senior Engineer role",
    );

    expect(prompt).toContain("Jane Smith <jane@acme.com>");
    expect(prompt).toContain("recruiterName");
    expect(prompt).toContain("jobDescription");
    expect(prompt).toContain("Do not invent details");
  });
});

describe("parseRecruiterEmailResponse", () => {
  it("parses valid recruiter email JSON", () => {
    expect(
      parseRecruiterEmailResponse(
        JSON.stringify({
          contactType: "EMAIL",
          recruiterName: "Jane Smith",
          recruiterEmail: "jane@acme.com",
          companyName: "Acme Corp",
          roleTitle: "Senior Software Engineer",
          contactDate: "2026-07-06",
          notes: "Remote role.",
        }),
      ),
    ).toEqual({
      ...parsedEmail,
      notes: "Remote role.",
    });
  });
});

describe("toOpportunityFormValues", () => {
  it("maps parsed values into form fields", () => {
    expect(toOpportunityFormValues(parsedEmail)).toEqual({
      contactType: ContactType.EMAIL,
      status: "NEW",
      recruiterName: "Jane Smith",
      recruiterEmail: "jane@acme.com",
      companyName: "Acme Corp",
      roleTitle: "Senior Software Engineer",
      contactDate: "2026-07-06",
      notes: "Remote role. Next step is a phone screen.",
      jobDescription: "",
      isAiRole: false,
    });
  });

  it("maps extracted job descriptions and suggests AI roles", () => {
    expect(
      toOpportunityFormValues({
        ...parsedEmail,
        roleTitle: "AI Platform Lead",
        jobDescription: "Own LLM deployment and MLOps.",
      }),
    ).toMatchObject({
      jobDescription: "Own LLM deployment and MLOps.",
      isAiRole: true,
    });
  });
});

describe("parseRecruiterEmail", () => {
  it("returns parsed recruiter email details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  contactType: "EMAIL",
                  recruiterName: "Jane Smith",
                  recruiterEmail: "jane@acme.com",
                  companyName: "Acme Corp",
                  roleTitle: "Senior Software Engineer",
                  contactDate: "2026-07-06",
                  notes: "Remote role.",
                }),
              },
            },
          ],
        }),
      }),
    );

    const result = await parseRecruiterEmail(
      { emailText: "From: Jane Smith <jane@acme.com>" },
      "test-api-key",
    );

    expect(result).toEqual({
      ...parsedEmail,
      notes: "Remote role.",
    });
  });
});
