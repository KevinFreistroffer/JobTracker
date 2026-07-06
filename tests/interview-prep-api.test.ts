import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/interview-prep/route";
import * as interviewPrep from "@/lib/interview-prep";
import * as openAiApiKey from "@/lib/openai-api-key";
import * as resume from "@/lib/resume";

const validPrep = {
  techStackSummary: "React and AWS.",
  roleFocusSummary: "Full-stack healthcare engineer.",
  technicalQuestions: [
    "Question 1",
    "Question 2",
    "Question 3",
    "Question 4",
    "Question 5",
  ],
  culturalQuestions: [
    "Culture 1",
    "Culture 2",
    "Culture 3",
    "Culture 4",
    "Culture 5",
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/interview-prep", () => {
  it("returns validation errors for missing fields", async () => {
    vi.spyOn(openAiApiKey, "getOpenAiApiKey").mockReturnValue("test-api-key");

    const response = await POST(
      new Request("http://localhost/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: "", jobDescription: "" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns generated interview prep", async () => {
    vi.spyOn(openAiApiKey, "getOpenAiApiKey").mockReturnValue("test-api-key");
    vi.spyOn(resume, "getResumeText").mockReturnValue("Resume text.");
    vi.spyOn(interviewPrep, "generateInterviewPrep").mockResolvedValue(
      validPrep,
    );

    const response = await POST(
      new Request("http://localhost/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Medallion",
          jobDescription: "Healthcare software role.",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(validPrep);
    expect(interviewPrep.generateInterviewPrep).toHaveBeenCalledWith(
      {
        resume: "Resume text.",
        companyName: "Medallion",
        jobDescription: "Healthcare software role.",
      },
      "test-api-key",
    );
  });

  it("returns 500 when the OpenAI API key is missing", async () => {
    vi.spyOn(openAiApiKey, "getOpenAiApiKey").mockReturnValue(undefined);

    const response = await POST(
      new Request("http://localhost/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Medallion",
          jobDescription: "Healthcare software role.",
        }),
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toContain("OPENAI_API_KEY");
  });
});
