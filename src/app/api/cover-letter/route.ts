import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateCoverLetter } from "@/lib/cover-letter";
import { getOpenAiApiKey } from "@/lib/openai-api-key";
import { getResumeText } from "@/lib/resume";

const requestSchema = z.object({
  companyName: z.string().trim().optional().default(""),
  jobDescription: z.string().trim().min(1, "Job description is required"),
});

export async function POST(request: NextRequest) {
  try {
    const apiKey = getOpenAiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY (or OPEN_API_KEY) is not configured. Add it to your environment variables.",
        },
        { status: 500 },
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const resume = getResumeText();
    const coverLetter = await generateCoverLetter(
      {
        resume,
        companyName: parsed.data.companyName,
        jobDescription: parsed.data.jobDescription,
      },
      apiKey,
    );

    return NextResponse.json({ coverLetter });
  } catch (error) {
    console.error("POST /api/cover-letter failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate cover letter",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
