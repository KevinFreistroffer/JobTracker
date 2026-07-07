import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api-error";
import { getStudySubjectRequirements } from "@/lib/ai-requirements-service";
import { generateAiStudySubjects } from "@/lib/ai-study-subjects";
import { getOpenAiApiKey } from "@/lib/openai-api-key";
import { requireSession } from "@/lib/require-session";

export async function POST() {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured" },
      { status: 500 },
    );
  }

  try {
    const requirements = await getStudySubjectRequirements();

    if (requirements.length === 0) {
      return NextResponse.json(
        {
          error:
            "No AI requirements found. Extract requirements from flagged AI job descriptions first.",
        },
        { status: 400 },
      );
    }

    const result = await generateAiStudySubjects({ requirements }, apiKey);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse("Failed to generate study subjects", error);
  }
}
