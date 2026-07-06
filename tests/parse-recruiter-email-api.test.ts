import { ContactType } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/opportunities/parse-email/route";
import * as openAiApiKey from "@/lib/openai-api-key";
import * as parseRecruiterEmail from "@/lib/parse-recruiter-email";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/opportunities/parse-email", () => {
  it("returns validation errors for empty email text", async () => {
    vi.spyOn(openAiApiKey, "getOpenAiApiKey").mockReturnValue("test-api-key");

    const response = await POST(
      new Request("http://localhost/api/opportunities/parse-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText: "" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns parsed recruiter email details", async () => {
    vi.spyOn(openAiApiKey, "getOpenAiApiKey").mockReturnValue("test-api-key");
    vi.spyOn(parseRecruiterEmail, "parseRecruiterEmail").mockResolvedValue({
      contactType: ContactType.EMAIL,
      recruiterName: "Jane Smith",
      recruiterEmail: "jane@acme.com",
      companyName: "Acme Corp",
      roleTitle: "Senior Software Engineer",
      contactDate: "2026-07-06",
      notes: "Remote role.",
    });

    const response = await POST(
      new Request("http://localhost/api/opportunities/parse-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailText: "From: Jane Smith <jane@acme.com>",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      recruiterName: "Jane Smith",
      companyName: "Acme Corp",
    });
  });
});
