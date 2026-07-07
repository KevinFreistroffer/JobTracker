import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api-error";
import { persistAiRequirementsFromAiJds } from "@/lib/ai-requirements-service";
import { getOpenAiApiKey } from "@/lib/openai-api-key";
import { requireSession } from "@/lib/require-session";
import { aiRequirementExtractInputSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
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
    const body = await request.json().catch(() => ({}));
    const parsed = aiRequirementExtractInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await persistAiRequirementsFromAiJds({
      apiKey,
      force: parsed.data.force ?? false,
    });

    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse("Failed to extract AI requirements", error);
  }
}
