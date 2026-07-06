import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toErrorResponse } from "@/lib/api-error";
import {
  generateJdInsights,
  getCorpusCharCount,
  MAX_CORPUS_CHARS,
} from "@/lib/jd-insights";
import { getOpenAiApiKey } from "@/lib/openai-api-key";
import {
  jobDescriptionInsightSchema,
  serializeJobDescription,
} from "@/lib/validations";

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
    const parsed = jobDescriptionInsightSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const jobDescriptions = await prisma.jobDescription.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (jobDescriptions.length === 0) {
      return NextResponse.json(
        { error: "Save at least one job description before asking a question." },
        { status: 400 },
      );
    }

    const serialized = jobDescriptions.map((jobDescription) =>
      serializeJobDescription(jobDescription),
    );

    if (getCorpusCharCount(serialized) > MAX_CORPUS_CHARS) {
      return NextResponse.json(
        {
          error: `Your JD library is too large for a single analysis (limit: ${MAX_CORPUS_CHARS.toLocaleString()} characters). Remove older entries or ask a narrower question later.`,
        },
        { status: 400 },
      );
    }

    const answer = await generateJdInsights(
      {
        question: parsed.data.question,
        jobDescriptions: serialized,
      },
      apiKey,
    );

    return NextResponse.json({ answer });
  } catch (error) {
    return toErrorResponse("Failed to generate JD insight", error);
  }
}
