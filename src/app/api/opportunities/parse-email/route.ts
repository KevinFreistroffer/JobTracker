import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAiApiKey } from "@/lib/openai-api-key";
import { parseRecruiterEmail } from "@/lib/parse-recruiter-email";

const requestSchema = z.object({
  emailText: z.string().trim().min(1, "Recruiter email text is required"),
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

    const opportunity = await parseRecruiterEmail(
      { emailText: parsed.data.emailText },
      apiKey,
    );

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("POST /api/opportunities/parse-email failed:", error);
    return NextResponse.json(
      {
        error: "Failed to parse recruiter email",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
