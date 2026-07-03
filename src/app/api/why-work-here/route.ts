import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getResumeText } from "@/lib/resume";
import { generateWhyWorkHereAnswer } from "@/lib/why-work-here";

const requestSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  jobDescription: z.string().trim().min(1, "Job description is required"),
});

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is not configured. Add it to your environment variables.",
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
    const answer = await generateWhyWorkHereAnswer(
      {
        resume,
        companyName: parsed.data.companyName,
        jobDescription: parsed.data.jobDescription,
      },
      apiKey,
    );

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("POST /api/why-work-here failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate answer",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
