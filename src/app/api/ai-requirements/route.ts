import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api-error";
import { listSerializedAiRequirements } from "@/lib/ai-requirements-service";
import { requireSession } from "@/lib/require-session";

export async function GET() {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const requirements = await listSerializedAiRequirements();
    return NextResponse.json(requirements);
  } catch (error) {
    return toErrorResponse("Failed to fetch AI requirements", error);
  }
}
